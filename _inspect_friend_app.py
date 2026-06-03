import re

html_content = open('app/index.html', 'r', encoding='utf-8').read()

scripts = re.findall(r'<script>(.*?)</script>', html_content, re.DOTALL)
print(f"Found {len(scripts)} inline scripts.")
for i, script in enumerate(scripts):
    print(f"\n--- Script {i+1} ({len(script)} chars) ---")
    # write to a temporary file so we can view it nicely
    open(f'app_script_{i+1}.js', 'w', encoding='utf-8').write(script)
    print(f"Saved to app_script_{i+1}.js. First 300 chars:")
    print(script[:300])
