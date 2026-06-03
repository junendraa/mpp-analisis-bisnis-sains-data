import json

nb = json.load(open('digital-marketing-analysis.ipynb', 'r', encoding='utf-8'))

for i, c in enumerate(nb['cells']):
    if i >= 21:
        print(f'--- Cell {i} ({c["cell_type"]}) ---')
        print(''.join(c['source']))
        if 'outputs' in c:
            for out in c['outputs']:
                if 'text' in out:
                    txt = ''.join(out['text'])
                    if len(txt) < 5000:
                        print('OUTPUT:', txt)
        print()
