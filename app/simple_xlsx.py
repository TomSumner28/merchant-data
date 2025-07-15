from __future__ import annotations

import xml.etree.ElementTree as ET
from zipfile import ZipFile
from typing import Dict, List


def read_xlsx(path: str) -> Dict[str, List[Dict[str, str]]]:
    """Parse an .xlsx file using only the standard library."""
    sheets: Dict[str, List[Dict[str, str]]] = {}
    with ZipFile(path) as zf:
        shared: List[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ET.parse(zf.open("xl/sharedStrings.xml")).getroot()
            shared = [t.text or "" for t in root.findall(".//t")]

        workbook = ET.parse(zf.open("xl/workbook.xml")).getroot()
        rels = ET.parse(zf.open("xl/_rels/workbook.xml.rels")).getroot()
        id_map = {rel.get("Id"): rel.get("Target") for rel in rels.findall(".//Relationship")}

        for idx, sheet in enumerate(workbook.findall(".//sheet"), 1):
            name = sheet.get("name", f"Sheet{idx}").lower()
            rId = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
            target = id_map.get(rId)
            if not target:
                continue
            path_xml = "xl/" + target
            if path_xml not in zf.namelist():
                continue
            root_ws = ET.parse(zf.open(path_xml)).getroot()
            rows: List[Dict[str, str]] = []
            header: List[str] = []
            for row in root_ws.findall(".//row"):
                cells = []
                for c in row.findall("c"):
                    v = c.find("v")
                    val = v.text if v is not None else ""
                    if c.get("t") == "s" and val and val.isdigit():
                        idx_s = int(val)
                        if idx_s < len(shared):
                            val = shared[idx_s]
                        else:
                            val = ""
                    cells.append(val)
                if not header:
                    header = [h.strip().lower().replace(" ", "_") for h in cells]
                    continue
                row_dict = {header[i]: cells[i] if i < len(cells) else "" for i in range(len(header))}
                rows.append(row_dict)
            sheets[name] = rows
    return sheets
