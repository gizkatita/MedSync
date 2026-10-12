from pathlib import Path
import re


FRONTEND = Path(__file__).resolve().parent
SOURCES = [
    FRONTEND / "config.js",
    FRONTEND / "js" / "karyawan.js",
    FRONTEND / "js" / "absensi.js",
    FRONTEND / "js" / "lembur.js",
    FRONTEND / "js" / "kinerja.js",
    FRONTEND / "js" / "payroll.js",
    FRONTEND / "js" / "accounting.js",
    FRONTEND / "js" / "payroll-deductions.js",
    FRONTEND / "js" / "payroll-loans.js",
    FRONTEND / "js" / "app.js",
]
OUTPUT = FRONTEND / "app.bundle.js"


def main():
    parts = []
    for source in SOURCES:
        text = source.read_text(encoding="utf-8")
        lines = []
        for line in text.splitlines():
            if line.startswith("import "):
                continue
            lines.append(re.sub(r"^export\s+", "", line))
        parts.append(f"// Source: {source.relative_to(FRONTEND)}\n" + "\n".join(lines))

    OUTPUT.write_text(
        "(function () {\n" + "\n\n".join(parts) + "\n})();\n",
        encoding="utf-8",
    )
    print(f"Built {OUTPUT.name} from {len(SOURCES)} source files.")


if __name__ == "__main__":
    main()
