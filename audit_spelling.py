import re
import glob

def check_all():
    files = glob.glob('js/*.js') + glob.glob('*.html') + glob.glob('*.css')
    print(f"Auditing {len(files)} files for spelling and typos...")

    typo_patterns = [
        r'\bproffess[a-z]*\b',
        r'\bcomparas[a-z]*\b',
        r'\bprious\b',
        r'\bprevoius\b',
        r'\bsomewath\b',
        r'\bexploranet\b',
        r'\bcompatability\b',
        r'\bdshboard\b',
        r'\bchildfrendly\b',
        r'\bfrendly\b',
        r'\brecieve[a-z]*\b',
        r'\bseperate[a-z]*\b',
        r'\boccured\b',
        r'\bdefinately\b',
        r'\bacrosss\b',
        r'\bcaliperr\b',
        r'\batmosfere\b',
        r'\bstratospere\b'
    ]

    total_issues = 0
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for lnum, line in enumerate(lines, 1):
            for pat in typo_patterns:
                m = re.search(pat, line, re.IGNORECASE)
                if m:
                    print(f"[{fpath}:{lnum}] Found typo: '{m.group(0)}' in line: {line.strip()[:100]}")
                    total_issues += 1

    if total_issues == 0:
        print("✅ Clean bill of health! Zero typos detected matching all target checks.")
    else:
        print(f"❌ Found {total_issues} issues to fix.")

if __name__ == '__main__':
    check_all()
