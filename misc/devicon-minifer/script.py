import json
import os

from fontTools.subset import (
    Options,
    Subsetter,
)
from fontTools.ttLib import (
    TTFont,
    newTable,
)


def get_unicode_values(font_path, desired_unicodes):
    font = TTFont(font_path)
    unicode_map = {}
    for table in font["cmap"].tables:
        for code, name in table.cmap.items():
            unicode_map[name] = code

    icon_unicodes = []
    glyph_names = []

    for desired_unicode in desired_unicodes:
        # Search for the glyph more thoroughly
        found = False
        for name, unicode in unicode_map.items():
            if f"uni{desired_unicode}".lower() == name.lower():
                icon_unicodes.append(hex(unicode)[2:].upper())
                glyph_names.append(name)
                found = True
                break

        if not found:
            print(f"Warning: Could not find glyph for {desired_unicode}")

    return icon_unicodes, glyph_names


def subset_font(input_font, output_font, unicodes, glyph_names):
    # Load the font
    font = TTFont(input_font)

    # Create subsetter with specific options
    options = Options()

    # Preserve important tables
    options.layout_features = ["*"]  # Preserve all layout features
    options.name_IDs = ["*"]  # Preserve all name records
    options.name_languages = ["*"]  # Preserve all language versions
    options.notdef_outline = True  # Preserve .notdef glyph
    options.recalc_bounds = True  # Recalculate font boundaries
    options.recalc_timestamp = False  # Keep original timestamps

    subsetter = Subsetter(options=options)

    # Add Unicode values and glyph names to keep
    unicodes = [int(code, 16) for code in unicodes]
    subsetter.populate(unicodes=unicodes)
    subsetter.populate(glyphs=glyph_names)

    # Add additional glyphs that might be required
    subsetter.populate(glyphs=[".notdef", "space"])

    # Subset the font
    subsetter.subset(font)

    # Ensure critical tables are present
    required_tables = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post"]
    for table_tag in required_tables:
        if table_tag not in font:
            print(f"Warning: Adding missing table {table_tag}")
            font[table_tag] = newTable(table_tag)

    # Update font metadata
    if "name" in font:
        nameTable = font["name"]
        nameTable.setName("Minified Devicon Subset", 1, 3, 1, 1033)  # Font Name
        nameTable.setName("Regular", 2, 3, 1, 1033)  # Font Subfamily
        nameTable.setName(
            "Minified Devicon Subset Regular", 4, 3, 1, 1033
        )  # Full font name

    # Save the subsetted font
    font.save(output_font)

    # Validate the font
    try:
        test_font = TTFont(output_font)
        test_font.close()
        print("Font validation successful!")
    except Exception as e:
        print(f"Font validation failed: {str(e)}")


def generate_css(unicodes, font_name, prefix="devicon"):
    css = f"""@font-face {{
    font-family: "devicon";
    src: url("fonts/{font_name}.woff2") format("woff2");
    font-weight: normal;
    font-style: normal;
    font-display: block;
}}
[class^="{prefix}-"],
[class*=" {prefix}-"] {{
    font-family: 'devicon' !important;
    speak: never;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}}

"""

    icons = [
        {"class": "devicon-typescript-plain", "name": "typescript"},
        {"class": "devicon-react-original", "name": "react"},
        {"class": "devicon-python-plain", "name": "python"},
        {"class": "devicon-go-original-wordmark", "name": "go"},
        {"class": "devicon-kotlin-plain", "name": "kotlin"},
        {"class": "devicon-dotnetcore-plain", "name": "dotnetcore"},
        {"class": "devicon-docker-plain", "name": "docker"},
        {"class": "devicon-postgresql-plain", "name": "postgresql"},
        {"class": "devicon-mongodb-plain", "name": "mongodb"},
        {"class": "devicon-sqlite-plain", "name": "sqlite"},
        {"class": "devicon-git-plain", "name": "git"},
        {"class": "devicon-amazonwebservices-original", "name": "aws"},
    ]

    for i, icon in enumerate(icons):
        if i < len(unicodes):
            css += f'.{icon["class"]}:before {{ content: "\\{unicodes[i]}"; }}\n'

    return css


if __name__ == "__main__":
    input_font = "input/devicon.ttf"
    output_font = "output/MinifiedDevicon.ttf"
    css_output = "output/minified-devicon.css"
    woff2_output = "output/MinifiedDevicon.woff2"

    unicodes = [
        "EC63",  # typescript
        "EBBC",  # react
        "EB9C",  # python
        "EA3D",  # go
        "EAB5",  # kotlin
        "E9CA",  # dotnetcore
        "E9C3",  # docker
        "EB79",  # postgresql,
        "EAF5",  # mongodb
        "EC1E",  # sqlite
        "EA2D",  # git
        "E90C",  # aws
    ]
    # Get unicode values and glyph names
    unicodes, glyph_names = get_unicode_values(input_font, unicodes)

    # Print found unicodes for verification
    print("Found Unicode values:", unicodes)
    print("Found glyph names:", glyph_names)

    # Subset the font
    subset_font(input_font, output_font, unicodes, glyph_names)

    # Generate CSS
    css = generate_css(unicodes, "MinifiedDevicon")

    # Save CSS file
    with open(css_output, "w") as f:
        f.write(css)
    os.system(f"fonttools ttLib.woff2 compress {output_font}")
