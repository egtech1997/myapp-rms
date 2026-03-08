import os
import re

directory = 'client/src/components/ui/'
files = [
    'AppButton.vue', 'AppDropdown.vue', 'AppInput.vue', 'AppPagination.vue',
    'AppRadio.vue', 'AppSelect.vue', 'AppSpinner.vue', 'AppTabs.vue',
    'AppTextarea.vue', 'AppToaster.vue', 'AppTooltip.vue', 'AppToast.vue',
    'AppSkeleton.vue', 'AppSwitch.vue', 'AppModal.vue', 'AppDivider.vue',
    'AppCheckbox.vue', 'AppCard.vue', 'AppBreadcrumb.vue', 'AppBadge.vue',
    'AppAlert.vue', 'AppAvatar.vue'
]

for filename in files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}: File not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Match HTML comment at the very beginning
    match = re.match(r'^\s*<!--(.*?)-->', content, re.DOTALL)
    if match:
        comment_content = match.group(1)
        rest_of_content = content[match.end():].lstrip()
        
        # Convert to JS comment
        js_comment = f"/*{comment_content}*/"
        
        # Check if <script setup> exists
        if '<script setup>' in rest_of_content:
            new_content = rest_of_content.replace('<script setup>', f'<script setup>\n{js_comment}', 1)
        else:
            # If no <script setup>, prepending it might be tricky if it's a template-only component
            # But the user asked to put it in <script setup>
            new_content = f"<script setup>\n{js_comment}\n</script>\n\n{rest_of_content}"
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
    else:
        print(f"No HTML comment found at start of {filepath}")
