# Large File Writing Guidelines

## Problem

The Write tool has content size limits. When attempting to write very large content (>~50KB), the tool may:
- Hang indefinitely without completing
- Fail silently
- Leave partial or corrupted files

## Solution

Use the `large-file-writer.ts` utility which automatically chunks content into safe-sized pieces.

### Quick Reference

| Content Size | Action |
|-------------|--------|
| < 40KB | Use regular `Write` tool |
| 40-100KB | Use `writeLargeFile()` utility |
| > 100KB | Use `writeLargeFile()` with smaller chunk size (20KB) |

### Usage

```typescript
import { writeLargeFile, shouldChunk } from '../utils/large-file-writer';

// Check if chunking is needed
if (shouldChunk(content, 40000)) {
  // Use chunked writer
  await writeLargeFile('/path/to/file.md', content);
} else {
  // Safe to use regular write
  fs.writeFileSync('/path/to/file.md', content);
}
```

### Chunk Size Guidelines

- **Default (40KB):** Safe for most cases, good balance
- **Small (20KB):** Use for very large files or when hitting limits
- **Large (60KB):** Only if default still fails

### Manual Chunking Pattern

If you cannot use the utility, follow this pattern manually:

1. **Split content into ~40KB chunks** at logical boundaries (newlines)
2. **Write first chunk** with `Write` tool (creates file)
3. **Append subsequent chunks** using `StrReplace`:
   - `old_string`: End of current file content
   - `new_string`: Current content + new chunk

Example:
```
// Chunk 1: Write initial content
Write: file.md with first 40000 chars

// Chunk 2: Append next chunk
StrReplace: path: file.md
  old_string: <last 100 chars of chunk 1>
  new_string: <last 100 chars of chunk 1> + <chunk 2>

// Repeat for remaining chunks
```

### When to Split vs. Chunk

**Chunk (single file, use utility):**
- Large markdown documents
- Generated code files
- Long configuration files
- JSON/YAML data files

**Split (multiple files):**
- Very long documentation (>200KB) - consider chapters
- Multi-part specifications
- Documentation with clear sections

### Testing Large Writes

Always verify the complete file was written:
1. Check file size matches expected
2. Read first and last few lines to verify boundaries
3. For critical files, verify total line count

### Common Mistakes

1. **Writing >100KB in single Write call** - Will hang/fail
2. **Splitting at arbitrary character boundaries** - May break words or formatting
3. **Not verifying completion** - File may be incomplete
4. **Using StrReplace with unique strings that appear multiple times** - Will fail

### File Size Estimation

Rough guide for content sizes:
- Text: ~1 byte per ASCII character
- Code: ~1-2 bytes per character
- Markdown with formatting: ~1-2 bytes per character
- UTF-8 with special chars: 2-4 bytes per character

Safety threshold: Keep Write operations under 40KB to guarantee success.
