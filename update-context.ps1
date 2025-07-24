# Update BulletinContext functions for multiple assignees
$file = "src/context/BulletinContext.tsx"
$content = Get-Content $file -Raw

# Update the interface signature for createPost
$content = $content -replace 'createPost: \(data: \{ title: string; content: string; actionItems: Array<\{text: string; assignedTo: string\}> \}\) => Promise<void\>;', 'createPost: (data: { title: string; content: string; actionItems: Array<{text: string; assignedUsers: Array<{id: string; full_name: string}>}> }) => Promise<void>;'

# Update the interface signature for addActionItem
$content = $content -replace 'addActionItem: \(postId: string, text: string, assignedToId: string\) => Promise<void\>;', 'addActionItem: (postId: string, text: string, assignedUsers: Array<{id: string; full_name: string}>) => Promise<void>;'

Set-Content $file $content -Encoding UTF8
Write-Host " Updated BulletinContext interface signatures"
