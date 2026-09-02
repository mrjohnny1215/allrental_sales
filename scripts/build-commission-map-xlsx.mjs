import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INPUT_XLSX = resolve(process.argv[2] || './attachments/수수료표.xlsx');
const OUTPUT_JSON = resolve(process.argv[3] || './commission-map.json');
const PYTHON = process.argv[4] || 'python3';

const pythonScript = `
import zipfile, re, json
from xml.etree import ElementTree as ET

xlsx_path = '${INPUT_XLSX}'
output_path = '${OUTPUT_JSON}.tmp'

ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def parse_sheet(z, target):
    root = ET.fromstring(z.read(target))
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
        shared = [''.join(t.text or '' for t in si.findall('.//main:t', ns)) for si in sst.findall('main:si', ns)]
    rows = []
    for row in root.find('main:sheetData', ns).findall('main:row', ns):
        vals = []
        for c in row.findall('main:c', ns):
            t = c.attrib.get('t')
            v = c.find('main:v', ns)
            if v is None:
                vals.append('')
            elif t == 's':
                vals.append(shared[int(v.text)])
            else:
                vals.append(v.text)
        rows.append(vals)
    return rows

with zipfile.ZipFile(xlsx_path) as z:
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rel_map = {r.attrib['Id']: r.attrib['Target'] for r in rels}
    all_rows = []
    for s in wb.find('main:sheets', ns):
        rid = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        target = 'xl/' + rel_map[rid]
        rows = parse_sheet(z, target)
        all_rows.extend(rows)

out = []
for row in all_rows:
    if len(row) < 6:
        continue
    brand = (row[0] or '').strip()
    model = (row[2] or '').strip()
    if not brand or not model:
        continue
    vals = []
    for cell in row[5:11]:
        try:
            n = float(cell)
            if n > 0:
                vals.append(n)
        except Exception:
            pass
    if not vals:
        continue
    out.append({'brand': brand, 'model': model, 'commission': max(vals)})

grouped = {}
for item in out:
    nb = re.sub(r'\\s+', '', item['brand']).upper()
    nm = re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', item['model']).upper()
    key = nb + '|' + nm
    if key not in grouped:
        grouped[key] = {'brand': item['brand'], 'model': item['model'], 'commission': item['commission'], 'sourceCount': 0}
    else:
        grouped[key]['commission'] = max(grouped[key]['commission'], item['commission'])

# Count source products by exact normalized brand+model
products = json.loads(readFile(resolve('../allrental_customer/products_data.json'), 'utf8').then(b => b.toString()));
for p in products:
    b = re.sub(r'\\s+', '', p.get('brand','')).upper()
    m = re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', p.get('model','')).upper()
    if not b or not m:
        continue
    k = b + '|' + m
    if k in grouped:
        grouped[k]['sourceCount'] += 1

entries = sorted(grouped.values(), key=lambda x: (x['brand'].upper(), x['model'].upper()))
result = {
  metadata: {
    source: 'mrjohnny1215/sales-os:수수료표.xlsx',
    matchKey: 'normalized brand + normalized model',
    amount: 'maximum registered commission across plans/regulations',
    entryCount: entries.length,
    brandAlias: {SK매직:'SK', 청호나이스:'청호', 현대큐밍:'현대'}
  },
  entries
}

writeFile(output_path, JSON.stringify(result, null, 2) + '\\n', 'utf8');
print('Wrote', entries.length, 'commission entries to', output_path);
`;

try {
  const pyPath = resolve('./scripts/extract-xlsx-commissions.py');
  await writeFile(pyPath, pythonScript, 'utf8');
  const output = execSync(`${PYTHON} ${pyPath}`, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
  console.log(output);
} catch (e) {
  console.error('Failed:', e.stdout || '', e.stderr || '');
  process.exit(1);
}
