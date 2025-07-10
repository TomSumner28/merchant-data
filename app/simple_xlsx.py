import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict

NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def _read_shared_strings(z: zipfile.ZipFile) -> List[str]:
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.iter(f'{{{NS_MAIN}}}t'):
            shared.append(si.text or '')
    return shared


def _sheet_paths(z: zipfile.ZipFile) -> Dict[str, str]:
    if 'xl/workbook.xml' not in z.namelist():
        return {}
    root = ET.fromstring(z.read('xl/workbook.xml'))
    sheet_map = {}
    for sheet in root.find(f'{{{NS_MAIN}}}sheets'):
        name = sheet.attrib.get('name')
        r_id = sheet.attrib.get(f'{{{NS_REL}}}id')
        sheet_map[r_id] = name

    paths = {}
    if 'xl/_rels/workbook.xml.rels' in z.namelist():
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        for rel in rels:
            r_id = rel.attrib.get('Id')
            target = rel.attrib.get('Target')
            if r_id in sheet_map:
                paths[sheet_map[r_id]] = 'xl/' + target
    return paths


def _read_sheet(z: zipfile.ZipFile, path: str, shared: List[str]) -> List[List[str]]:
    rows = []
    root = ET.fromstring(z.read(path))
    for row in root.iter(f'{{{NS_MAIN}}}row'):
        row_data = []
        for c in row.iter(f'{{{NS_MAIN}}}c'):
            cell_type = c.attrib.get('t')
            v = c.find(f'{{{NS_MAIN}}}v')
            value = v.text if v is not None else ''
            if cell_type == 's' and value.isdigit():
                idx = int(value)
                if 0 <= idx < len(shared):
                    value = shared[idx]
            row_data.append(value)
        rows.append(row_data)
    return rows


def read_workbook(path: str) -> Dict[str, List[Dict[str, str]]]:
    """Return workbook sheets as list of dicts keyed by sheet name."""
    with zipfile.ZipFile(path) as z:
        shared = _read_shared_strings(z)
        sheet_paths = _sheet_paths(z)
        data = {}
        for name, sheet_path in sheet_paths.items():
            rows = _read_sheet(z, sheet_path, shared)
            if not rows:
                data[name] = []
                continue
            headers = rows[0]
            sheet_data = []
            for r in rows[1:]:
                item = {headers[i]: r[i] if i < len(r) else '' for i in range(len(headers))}
                sheet_data.append(item)
            data[name] = sheet_data
        return data
