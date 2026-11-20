# Copyright 2026 Delphi Tech. All Rights Reserved.
# Author: pstefanou12@
"""Export delphi.ai's public API as a JSON manifest for the docs.

Nothing here lists models, sections or groups: everything is discovered.

* A documented class is a public class defined in a module named after it,
  ``truncated_normal.py`` for ``TruncatedNormal``, or a public subclass of
  that class defined beside it, anywhere under ``delphi`` except tests. Pydantic configs are documented through the models that use
  them, not on their own.
* A class's package is its module's parent package, and the docs' parts and
  sections are packages, titled by name and described by their docstrings.
* A class's estimates are the properties ``p`` it exposes at every
  ``constants.Estimator`` as ``{estimator}_p``.
* Methods are the public ones a delphi class defines, minus the trainer's
  protocol: anything ``DelphiModel`` declares, or a non-delphi base does.
* A config's fields are grouped by the config class that declares them, in
  method resolution order, so a model's own fields come first.

Run inside delphi.ai's environment:

    poetry -C ~/delphi.ai run python export_api.py --source ~/delphi.ai \\
        --out api.json --schema api.schema.json [--ref <git ref>]

With ``--ref``, the package is read from that ref of the ``--source``
checkout, exported to a temporary directory, so an unmerged branch can be
documented without checking it out. A class that cannot be documented fails
the run, so the docs never drift silently.

This is a development tool, not part of the package: it moves into
delphi.ai as ``tools/export_api.py``.
"""

from __future__ import annotations

import argparse
from collections.abc import Iterator, Mapping
import dataclasses
import enum
import importlib
import inspect
import json
import pathlib
import pkgutil
import re
import subprocess
import sys
import tempfile
import types
from typing import Any, Literal, Optional

import pydantic
from pydantic import alias_generators
import tomllib

# TODO(pstefanou12): Delete once delphi.ai's package move lands (#76):
# distributions then live in delphi.distributions.truncated, beside
# delphi.stats.truncated, and need no mapping.
_PACKAGE_MOVES: Mapping[str, str] = {
    "delphi.truncated.distributions": "delphi.distributions.truncated",
}
_MOVED_PARENT_DOCSTRINGS: Mapping[str, str] = {
    "delphi.distributions": "Probability distributions, by how they are observed.",
}

_SECTION = re.compile(r"^(\w[\w ]*):\s*$")
_ENTRY = re.compile(r"^(\*{0,2}\w+)(?:\s*\(([^)]*)\))?:\s*(.*)$")
_QUALIFIED = re.compile(r"\b(?:[a-z_]\w*\.)+([A-Z]\w*)")
_WORD = re.compile(r"[A-Z]+(?=[A-Z][a-z]|\d|\b)|[A-Z]?[a-z]+\d*|[A-Z]+\d*|\d+")


class _Schema(pydantic.BaseModel):
    """Base of the manifest's records: camelCase in JSON, closed and frozen."""

    model_config = pydantic.ConfigDict(
        alias_generator=alias_generators.to_camel,
        populate_by_name=True,
        extra="forbid",
        frozen=True,
    )


ParamKind = Literal[
    "positional_only",
    "positional_or_keyword",
    "var_positional",
    "keyword_only",
    "var_keyword",
]


_PARAM_KINDS: Mapping[Any, ParamKind] = {
    inspect.Parameter.POSITIONAL_ONLY: "positional_only",
    inspect.Parameter.POSITIONAL_OR_KEYWORD: "positional_or_keyword",
    inspect.Parameter.VAR_POSITIONAL: "var_positional",
    inspect.Parameter.KEYWORD_ONLY: "keyword_only",
    inspect.Parameter.VAR_KEYWORD: "var_keyword",
}


class Param(_Schema):
    """One argument of a constructor or method."""

    name: str
    type: Optional[str]
    default: Optional[str] = pydantic.Field(
        description="Python source of the default, or null when required."
    )
    kind: ParamKind
    description: str


class Method(_Schema):
    """A public method."""

    name: str
    params: list[Param] = pydantic.Field(description="Without self or cls.")
    returns: Optional[str]
    summary: str
    defined_in: str


class Property(_Schema):
    """A public property that is not one of the class's estimates."""

    name: str
    type: Optional[str]
    summary: str
    defined_in: str


class ConfigField(_Schema):
    """One hyperparameter: a field of a pydantic config."""

    name: str
    type: Optional[str]
    default: Optional[str]
    required: bool
    description: str


class ConfigGroup(_Schema):
    """The fields one config class declares itself."""

    name: str = pydantic.Field(description="The declaring config class.")
    summary: str
    fields: list[ConfigField]


class Config(_Schema):
    """A pydantic config, its fields grouped by declaring class, own first."""

    name: str
    module: str
    groups: list[ConfigGroup]


class Source(_Schema):
    """Where a definition lives in the repository."""

    path: str = pydantic.Field(description="Relative to the repository root.")
    line: int


class Reference(_Schema):
    """A paper a class implements or builds on."""

    key: str
    authors: str
    title: str
    venue: str
    year: int
    url: str


class ClassDoc(_Schema):
    """Everything the docs know about one public class."""

    name: str
    module: str
    package: str = pydantic.Field(description="Key of the class's package.")
    title: str = pydantic.Field(
        description="display_name if the class sets one, else its name in "
        "words, less its package's name."
    )
    summary: str
    docstring: str
    abstract: bool
    bases: list[str] = pydantic.Field(
        description="Every delphi class in the MRO after this one, in order."
    )
    attributes: dict[str, str]
    params: list[Param] = pydantic.Field(description="The constructor's.")
    raises: dict[str, str]
    estimates: list[str]
    methods: list[Method]
    properties: list[Property]
    config: Optional[str] = pydantic.Field(description="Key into configs.")
    references: list[str] = pydantic.Field(description="Keys into references.")
    source: Source


class Package(_Schema):
    """A package holding documented classes, or one of its ancestors."""

    name: str
    title: str
    summary: str
    docstring: str


class Estimator(_Schema):
    """An iterate a fit reports estimates at, as ``{name}_{estimate}``."""

    name: str
    description: str


class Citation(_Schema):
    """How to cite delphi.ai, from its CITATION.cff."""

    title: str
    message: str
    authors: list[str] = pydantic.Field(description="As 'Family, Given'.")
    version: str
    url: str


class ApiManifest(_Schema):
    """delphi.ai's public API, as the docs read it."""

    version: str
    repository: str
    citation: Optional[Citation]
    estimators: list[Estimator]
    packages: dict[str, Package]
    classes: dict[str, ClassDoc] = pydantic.Field(
        description="Keyed by qualified name, module.Class."
    )
    configs: dict[str, Config]
    references: dict[str, Reference]


@dataclasses.dataclass(frozen=True)
class _Docstring:
    """A Google-style docstring, split."""

    summary: str
    body: str
    sections: Mapping[str, Mapping[str, str]]


def _parse_docstring(doc: Optional[str]) -> _Docstring:
    """Split a docstring into its first paragraph, prose and sections."""
    prose: list[str] = []
    sections: dict[str, dict[str, str]] = {}
    current: Optional[str] = None
    entry: Optional[str] = None
    for line in inspect.cleandoc(doc or "").splitlines():
        header = _SECTION.match(line)
        if header and not line.startswith(" "):
            current = header.group(1)
            sections.setdefault(current, {})
            entry = None
            continue
        if current is None:
            prose.append(line)
            continue
        stripped = line.strip()
        if not stripped:
            continue
        match = _ENTRY.match(stripped)
        if match and len(line) - len(line.lstrip()) <= 4:
            entry = match.group(1).lstrip("*")
            sections[current][entry] = match.group(3).strip()
        elif entry is not None:
            sections[current][entry] = f"{sections[current][entry]} {stripped}"
    body = "\n".join(prose).strip()
    summary = body.split("\n\n")[0].replace("\n", " ") if body else ""
    return _Docstring(summary, body, sections)


def _annotation(annotation: Any) -> Optional[str]:
    """Render an annotation as it would be written in source."""
    if annotation is inspect.Parameter.empty or annotation is None:
        return None
    if isinstance(annotation, type) and not isinstance(annotation, types.GenericAlias):
        return annotation.__name__
    text = str(annotation).replace("typing.", "")
    text = re.sub(r"<class '([\w.]+)'>", r"\1", text)
    return _QUALIFIED.sub(r"\1", text).replace("NoneType", "None")


def _source_text(value: Any) -> Optional[str]:
    """Render a default as Python source, or None when there is none."""
    if value is inspect.Parameter.empty:
        return None
    if isinstance(value, enum.Enum):
        return f"{type(value).__name__}.{value.name}"
    if callable(value) and hasattr(value, "__name__"):
        return value.__name__
    return repr(value)


def _params(function: Any, docs: Mapping[str, str]) -> list[Param]:
    """Return a function's parameters, without self or cls."""
    try:
        signature = inspect.signature(function)
    except (TypeError, ValueError):
        return []
    return [
        Param(
            name=param.name,
            type=_annotation(param.annotation),
            default=_source_text(param.default),
            kind=_PARAM_KINDS[param.kind],
            description=docs.get(param.name, ""),
        )
        for param in signature.parameters.values()
        if param.name not in ("self", "cls")
    ]


def _words(name: str) -> list[str]:
    """Split a CamelCase name into words, keeping acronyms whole."""
    return _WORD.findall(name)


def _title(cls: type, package: str) -> str:
    """Return a class's display name: its own, or its name in words."""
    explicit = vars(cls).get("display_name")
    if isinstance(explicit, str):
        return explicit
    words = _words(cls.__name__)
    prefix = package.rsplit(".", 1)[-1].replace("_", " ").title().split()
    if words[: len(prefix)] == prefix and len(words) > len(prefix):
        words = words[len(prefix) :]
    return " ".join(words)


def _snake(name: str) -> str:
    """Return a CamelCase name in snake_case, as its module would be named."""
    return "_".join(word.lower() for word in _words(name))


def _package_of(module: str) -> str:
    """Return a module's package, as the docs place it."""
    package = module.rsplit(".", 1)[0]
    return _PACKAGE_MOVES.get(package, package)


def _owner(cls: type, name: str) -> type:
    """Return the first class in the MRO whose namespace defines a name."""
    return next(klass for klass in cls.__mro__ if name in vars(klass))


def _constructor_doc(cls: type) -> Optional[str]:
    """Return the docstring of the __init__ a class's constructor runs."""
    for klass in cls.__mro__:
        if "__init__" in vars(klass):
            return vars(klass)["__init__"].__doc__
    return None


def _is_delphi(klass: type) -> bool:
    return klass.__module__.split(".")[0] == "delphi"


class _Exporter:
    """Builds the manifest from an imported delphi package."""

    def __init__(self, root: pathlib.Path):
        self.root = root
        self.delphi_model: type = importlib.import_module("delphi.delphi").DelphiModel
        constants = importlib.import_module("delphi.utils.constants")
        self.estimators: list[str] = [member.value for member in constants.Estimator]
        # A member documents itself only if its docstring is not the enum's.
        self.estimator_docs: Mapping[str, str] = {
            member.value: (
                ""
                if member.__doc__ == constants.Estimator.__doc__
                else _parse_docstring(member.__doc__).summary
            )
            for member in constants.Estimator
        }
        self.configs: dict[str, Config] = {}
        self.references: dict[str, Reference] = {}

    def modules(self) -> Iterator[types.ModuleType]:
        """Yield every module of the package, tests excepted."""
        delphi = importlib.import_module("delphi")
        for info in pkgutil.walk_packages(delphi.__path__, "delphi."):
            parts = info.name.split(".")
            if "tests" in parts or parts[-1].endswith("_test"):
                continue
            yield importlib.import_module(info.name)

    def documented(self, module: types.ModuleType) -> Iterator[type]:
        """Yield the classes a module documents.

        A module documents the public class it is named after, and the
        public subclasses of that class it defines beside it, such as
        ``Pipeline`` in ``transformation.py``.
        """
        leaf = module.__name__.rsplit(".", 1)[-1]
        public = [
            value
            for name, value in vars(module).items()
            if inspect.isclass(value)
            and value.__module__ == module.__name__
            and not name.startswith("_")
            and not issubclass(value, pydantic.BaseModel)
        ]
        namesake = next((cls for cls in public if _snake(cls.__name__) == leaf), None)
        if namesake is None:
            return
        yield from (cls for cls in public if issubclass(cls, namesake))

    def protocol(self, cls: type, name: str) -> bool:
        """True for names the trainer calls rather than users."""
        if issubclass(cls, self.delphi_model) and any(
            name in vars(klass) for klass in self.delphi_model.__mro__
        ):
            return True
        return any(
            name in vars(klass) for klass in cls.__mro__ if not _is_delphi(klass)
        )

    def estimates(self, cls: type) -> list[str]:
        """Return the properties exposed at every estimator."""
        names = {name for name, _ in inspect.getmembers(cls, _is_property)}
        first = f"{self.estimators[0]}_"
        return sorted(
            name.removeprefix(first)
            for name in names
            if name.startswith(first)
            and all(
                f"{estimator}_{name.removeprefix(first)}" in names
                for estimator in self.estimators
            )
        )

    def methods(self, cls: type) -> list[Method]:
        """Return the public methods a delphi class defines."""
        out = []
        for name, function in inspect.getmembers(cls, inspect.isfunction):
            owner = _owner(cls, name)
            if (
                name.startswith("_")
                or not _is_delphi(owner)
                or self.protocol(cls, name)
            ):
                continue
            doc = _parse_docstring(function.__doc__)
            try:
                returns = _annotation(inspect.signature(function).return_annotation)
            except (TypeError, ValueError):
                returns = None
            out.append(
                Method(
                    name=name,
                    params=_params(function, doc.sections.get("Args", {})),
                    returns=returns,
                    summary=doc.summary,
                    defined_in=owner.__name__,
                )
            )
        return out

    def properties(self, cls: type, estimates: list[str]) -> list[Property]:
        """Return the public properties, less the estimates and their variants."""
        hidden = set(estimates) | {
            f"{estimator}_{name}" for estimator in self.estimators for name in estimates
        }
        out = []
        for name, prop in inspect.getmembers(cls, _is_property):
            owner = _owner(cls, name)
            if (
                name.startswith("_")
                or name in hidden
                or not _is_delphi(owner)
                or self.protocol(cls, name)
            ):
                continue
            returns = None
            if prop.fget is not None:
                returns = _annotation(inspect.signature(prop.fget).return_annotation)
            out.append(
                Property(
                    name=name,
                    type=returns,
                    summary=_parse_docstring(prop.__doc__).summary,
                    defined_in=owner.__name__,
                )
            )
        return out

    def config(self, cls: type) -> Optional[str]:
        """Record the class's pydantic config, and return its key."""
        config_cls = getattr(cls, "defaults", None)
        if not (
            inspect.isclass(config_cls) and issubclass(config_cls, pydantic.BaseModel)
        ):
            return None
        if config_cls.__name__ not in self.configs:
            self.configs[config_cls.__name__] = _config(config_cls)
        return config_cls.__name__

    def class_references(self, cls: type) -> list[str]:
        """Record the papers the class declares, its bases' included."""
        keys = []
        for reference in getattr(cls, "references", ()):
            record = Reference.model_validate(dataclasses.asdict(reference))
            self.references.setdefault(record.key, record)
            keys.append(record.key)
        return keys

    def document(self, cls: type) -> ClassDoc:
        """Return one class's record."""
        doc = _parse_docstring(cls.__doc__)
        init = _parse_docstring(_constructor_doc(cls))
        estimates = self.estimates(cls)
        package = _package_of(cls.__module__)
        _, line = inspect.getsourcelines(cls)
        path = pathlib.Path(inspect.getfile(cls)).resolve()
        return ClassDoc(
            name=cls.__name__,
            module=cls.__module__,
            package=package,
            title=_title(cls, package),
            summary=doc.summary,
            docstring=doc.body,
            abstract=inspect.isabstract(cls),
            bases=[
                klass.__name__
                for klass in cls.__mro__[1:]
                if _is_delphi(klass) and not issubclass(klass, pydantic.BaseModel)
            ],
            attributes=dict(doc.sections.get("Attributes", {})),
            # The class's signature is its constructor's, without self.
            params=_params(cls, init.sections.get("Args", {})),
            raises=dict(init.sections.get("Raises", {})),
            estimates=estimates,
            methods=self.methods(cls),
            properties=self.properties(cls, estimates),
            config=self.config(cls),
            references=self.class_references(cls),
            source=Source(path=str(path.relative_to(self.root)), line=line),
        )

    def packages(self, keys: set[str]) -> dict[str, Package]:
        """Return each package and its ancestors below delphi."""
        moved = {target: source for source, target in _PACKAGE_MOVES.items()}
        out = {}
        for key in sorted(keys):
            parts = key.split(".")
            for depth in range(2, len(parts) + 1):
                name = ".".join(parts[:depth])
                if name in out:
                    continue
                try:
                    docstring = importlib.import_module(moved.get(name, name)).__doc__
                except ModuleNotFoundError:
                    docstring = _MOVED_PARENT_DOCSTRINGS[name]
                doc = _parse_docstring(docstring)
                out[name] = Package(
                    name=name,
                    title=parts[depth - 1].replace("_", " ").capitalize(),
                    summary=doc.summary,
                    docstring=doc.body,
                )
        return out

    def citation(self) -> Optional[Citation]:
        """Return CITATION.cff's fields, when the repository has one."""
        path = self.root / "CITATION.cff"
        if not path.exists():
            return None
        yaml = importlib.import_module("yaml")
        cff = yaml.safe_load(path.read_text())
        return Citation(
            title=cff["title"],
            message=cff["message"],
            authors=[
                f"{author['family-names']}, {author['given-names']}"
                for author in cff["authors"]
            ],
            version=str(cff["version"]),
            url=cff.get("repository-code") or cff["url"],
        )

    def manifest(self) -> ApiManifest:
        """Document every public class."""
        classes: dict[str, ClassDoc] = {}
        failures = []
        for module in self.modules():
            for cls in self.documented(module):
                try:
                    record = self.document(cls)
                except Exception as error:  # pylint: disable=broad-except
                    failures.append(f"{module.__name__}.{cls.__name__}: {error!r}")
                    continue
                classes[f"{record.module}.{record.name}"] = record
        if failures:
            sys.exit("could not document:\n  " + "\n  ".join(failures))
        pyproject = tomllib.loads((self.root / "pyproject.toml").read_text())
        citation = self.citation()
        return ApiManifest(
            version=pyproject["tool"]["poetry"]["version"],
            repository=citation.url
            if citation
            else pyproject["tool"]["poetry"]["repository"],
            citation=citation,
            estimators=[
                Estimator(name=name, description=self.estimator_docs[name])
                for name in self.estimators
            ],
            packages=self.packages({record.package for record in classes.values()}),
            classes=dict(sorted(classes.items())),
            configs=dict(sorted(self.configs.items())),
            references=dict(sorted(self.references.items())),
        )


def _is_property(value: Any) -> bool:
    return isinstance(value, property)


def _config(config_cls: type[pydantic.BaseModel]) -> Config:
    """Return a config's fields, grouped by the class that declares each."""
    described: dict[str, str] = {}
    for klass in reversed(config_cls.__mro__):
        described.update(_parse_docstring(klass.__doc__).sections.get("Attributes", {}))
    groups = []
    for klass in config_cls.__mro__:
        if not (_is_delphi(klass) and issubclass(klass, pydantic.BaseModel)):
            continue
        own = [
            name
            for name in inspect.get_annotations(klass)
            if name in config_cls.model_fields
            and name not in _declared_later(config_cls, klass, name)
        ]
        if not own:
            continue
        fields = []
        for name in own:
            field = config_cls.model_fields[name]
            fields.append(
                ConfigField(
                    name=name,
                    type=_annotation(field.annotation),
                    default=None
                    if field.is_required()
                    else repr(field.get_default(call_default_factory=True)),
                    required=field.is_required(),
                    description=field.description or described.get(name, ""),
                )
            )
        groups.append(
            ConfigGroup(
                name=klass.__name__,
                summary=_parse_docstring(klass.__doc__).summary,
                fields=fields,
            )
        )
    return Config(name=config_cls.__name__, module=config_cls.__module__, groups=groups)


def _declared_later(config_cls: type, klass: type, name: str) -> set[str]:
    """Return {name} if a class earlier in the MRO than klass declares it.

    A field redeclared by a subclass (to change its default) belongs to the
    most derived declaration, so it appears in one group only.
    """
    for earlier in config_cls.__mro__:
        if earlier is klass:
            return set()
        if name in inspect.get_annotations(earlier):
            return {name}
    return set()


def _schema() -> dict[str, Any]:
    """Return the manifest's JSON Schema, without per-field titles.

    Pydantic titles every field, which TypeScript generators turn into one
    alias per field; the record types are named by their own titles.
    """
    schema = ApiManifest.model_json_schema(by_alias=True)
    for record in [schema, *schema.get("$defs", {}).values()]:
        for field in record.get("properties", {}).values():
            field.pop("title", None)
    return schema


def _checkout(source: pathlib.Path, ref: str) -> pathlib.Path:
    """Export a git ref of the source checkout to a temporary directory."""
    target = pathlib.Path(tempfile.mkdtemp(prefix="delphi-api-"))
    archive = subprocess.run(
        [
            "git",
            "-C",
            str(source),
            "archive",
            ref,
            "delphi",
            "pyproject.toml",
            "CITATION.cff",
        ],
        capture_output=True,
        check=True,
    ).stdout
    subprocess.run(["tar", "-x", "-C", str(target)], input=archive, check=True)
    print(f"documenting {ref} of {source}")
    return target


def main() -> None:
    """Write the manifest and its JSON Schema."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=pathlib.Path, default=pathlib.Path.cwd())
    parser.add_argument("--ref", help="git ref of --source to document")
    parser.add_argument("--out", required=True, type=pathlib.Path)
    parser.add_argument("--schema", required=True, type=pathlib.Path)
    args = parser.parse_args()

    root = (_checkout(args.source, args.ref) if args.ref else args.source).resolve()
    # Import this tree's delphi, not whichever the environment installed.
    sys.path.insert(0, str(root))
    manifest = _Exporter(root).manifest()

    for path, payload in (
        (args.out, manifest.model_dump(mode="json", by_alias=True)),
        (args.schema, _schema()),
    ):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {len(manifest.classes)} classes to {args.out}")


if __name__ == "__main__":
    main()
