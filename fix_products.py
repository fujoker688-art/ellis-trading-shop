import re, subprocess

with open('js/products.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace literal newlines inside single-quoted strings with \n escape
result_chars = []
in_string = False
i = 0
while i < len(content):
    ch = content[i]
    if ch == "'" and (i == 0 or content[i-1] != '\\'):
        in_string = not in_string
        result_chars.append(ch)
    elif in_string and ch in '\r\n':
        result_chars.append('\\n')
        if ch == '\r' and i+1 < len(content) and content[i+1] == '\n':
            i += 1
    else:
        result_chars.append(ch)
    i += 1

content = ''.join(result_chars)

# Now group lines and wrap
lines = content.split('\n')
entries = []
current = []
in_array = False

for line in lines:
    stripped = line.rstrip()
    # Detect array start
    if re.match(r'^\s+\w+: \[', stripped) and not stripped.startswith('const'):
        in_array = True
        entries.append(('marker', stripped))
        continue
    # Detect array end - match ] or ]; or ], with possible CR
    if in_array and re.match(r'^\s+\]', stripped):
        in_array = False
        if current:
            entries.append(('entry', '\n'.join(current)))
            current = []
        entries.append(('marker', stripped))
        continue
    if in_array:
        if re.match(r'^\s+dpId:', stripped):
            if current:
                entries.append(('entry', '\n'.join(current)))
            current = [stripped]
        elif current:
            current.append(stripped)
        else:
            entries.append(('other', stripped))
    else:
        entries.append(('other', stripped))
if current:
    entries.append(('entry', '\n'.join(current)))

fixed_count = 0
fixed_lines = []
for entry in entries:
    if entry[0] == 'entry':
        text = entry[1]
        fixed_count += 1
        if text.rstrip().endswith(','):
            text = text.rstrip()[:-1]
        fixed_lines.append('    {' + text + '},')
    else:
        fixed_lines.append(entry[1])

result = '\n'.join(fixed_lines)
with open('js/products.js', 'w', encoding='utf-8') as f:
    f.write(result)

r = subprocess.run(['node', '-c', 'js/products.js'], capture_output=True, text=True)
print(f"Fixed {fixed_count} entries — " + ('VALID' if r.returncode == 0 else r.stderr.strip()[:300]))
