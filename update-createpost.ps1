$file = "src/context/BulletinContext.tsx"
$content = Get-Content $file -Raw

# Update createPost function signature and implementation
$oldCreatePost = 'const createPost = async \(data: \{ title: string; content: string; actionItems: Array<\{text: string; assignedTo: string\}> \}\)'
$newCreatePost = 'const createPost = async (data: { title: string; content: string; actionItems: Array<{text: string; assignedUsers: Array<{id: string; full_name: string}>}> })'

# Update the function signature first
$content = $content -replace $oldCreatePost, $newCreatePost

# Update the mapping inside the createPost function
$oldMapping = 'assigned_to_id: item\.assignedTo,\s*assigned_to_name: getUserNameById\(item\.assignedTo\),'
$newMapping = @"
// New multiple assignee fields
          assigned_to_ids: item.assignedUsers.map(u => u.id),
          assigned_to_names: item.assignedUsers.map(u => u.full_name),
          // Legacy single assignee fields (for backward compatibility - use first assignee)
          assigned_to_id: item.assignedUsers.length > 0 ? item.assignedUsers[0].id : '',
          assigned_to_name: item.assignedUsers.length > 0 ? item.assignedUsers[0].full_name : '',
"@

$content = $content -replace $oldMapping, $newMapping

Set-Content $file $content -Encoding UTF8
Write-Host " Updated createPost function"
