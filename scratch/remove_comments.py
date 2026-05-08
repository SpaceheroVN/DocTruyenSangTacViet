import re
import os

def remove_comments(content, file_type):
    if file_type == 'html':
        # Remove HTML comments <!-- ... -->
        content = re.sub(r'<!--[\s\S]*?-->', '', content)
        # For <style> blocks, remove /* ... */
        def remove_css_comments(match):
            style_content = match.group(0)
            style_content = re.sub(r'/\*[\s\S]*?\*/', '', style_content)
            return style_content
        content = re.sub(r'<style[\s\S]*?>[\s\S]*?</style>', remove_css_comments, content)
        # For <script> blocks, remove // and /* ... */
        def remove_js_comments_in_html(match):
            script_content = match.group(0)
            # Remove multi-line /* ... */
            script_content = re.sub(r'/\*[\s\S]*?\*/', '', script_content)
            # Remove single line // ... (careful with https://)
            # Use a more sophisticated regex for JS single line comments
            # This is a simplified version
            lines = script_content.split('\n')
            new_lines = []
            for line in lines:
                # Remove // if not inside quotes and not part of URL
                # Match // that is NOT preceded by : (simple check)
                line = re.sub(r'(?<!:)\/\/.*', '', line)
                new_lines.append(line)
            return '\n'.join(new_lines)
        content = re.sub(r'<script[\s\S]*?>[\s\S]*?</script>', remove_js_comments_in_html, content)
    elif file_type == 'js':
        # Remove multi-line comments
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        # Remove single line comments
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            # Simple check for // that is not part of a URL
            # A better way is to check if it's outside of strings, but for this project this might suffice
            # Let's use a regex that matches // but not if it's immediately after a colon
            line = re.sub(r'(?<!:)\/\/.*', '', line)
            new_lines.append(line)
        content = '\n'.join(new_lines)
    return content

files_to_process = [
    ('versions/DocTruyenSTV_v0.2/guide_v0.2.html', 'html'),
    ('versions/DocTruyenSTV_v0.2/popup_v0.2.html', 'html'),
    ('versions/DocTruyenSTV_v0.2/content_v0.2.js', 'js'),
    ('versions/DocTruyenSTV_v0.2/popup_v0.2.js', 'js')
]

base_path = r'c:\Users\Space\OneDrive\Documents\GitHub\DocTruyenSangTacViet'

for rel_path, ftype in files_to_process:
    abs_path = os.path.join(base_path, rel_path)
    if os.path.exists(abs_path):
        print(f"Processing {rel_path}...")
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = remove_comments(content, ftype)
        
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Done.")
    else:
        print(f"File not found: {rel_path}")
