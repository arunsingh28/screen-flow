# TOON Integration - Token Optimization

## Overview

Integrated **TOON (Token-Oriented Object Notation)** to reduce LLM token usage by **30-60%** compared to standard JSON formatting.

TOON is a compact, human-readable data format specifically designed for LLM prompts. It uses tabular notation for arrays and key-value pairs, significantly reducing token count.

## What is TOON?

Token-Oriented Object Notation (TOON) is an LLM-optimized data serialization format that:
- Reduces token usage by 30-60% vs JSON
- Maintains human readability
- Uses compact tabular notation for arrays
- Supports nested objects and complex data structures

## Installation

```bash
pip install git+https://github.com/toon-format/toon-python.git
```

Already added to `requirements.txt`.

## Example: Token Savings

### Standard JSON (46 tokens)
```json
{
  "candidates": [
    {
      "id": 1,
      "name": "Alice",
      "skills": ["Python", "React"]
    },
    {
      "id": 2,
      "name": "Bob",
      "skills": ["Java", "Angular"]
    }
  ]
}
```

### TOON Format (24 tokens - 48% savings!)
```
candidates[2,]{id,name,skills}:
1,Alice,["Python","React"]
2,Bob,["Java","Angular"]
```

## How It Works

### 1. TOON Service (`app/services/toon_service.py`)

Provides encoding/decoding utilities:

```python
from app.services.toon_service import toon_service

# Encode data to TOON format
data = {"name": "Alice", "age": 30}
toon_encoded = toon_service.encode_data(data)
# Output: "name: Alice\nage: 30"

# Decode TOON back to Python
decoded = toon_service.decode_data(toon_encoded)
# Output: {"name": "Alice", "age": 30}

# Estimate token savings
savings = toon_service.estimate_token_savings(data)
print(f"Token savings: {savings['savings_percent']}%")
```

### 2. Integration with Bedrock Service

The Bedrock service automatically uses TOON encoding when `use_toon=True` (default):

```python
result = await bedrock_service.invoke_claude(
    prompt=prompt,
    db=db,
    user_id=user_id,
    call_type=LLMCallType.CV_PARSING,
    use_toon=True,  # Default: True
)
```

### 3. Automatic Optimization

All LLM calls now benefit from TOON optimization:

- **JD Generation**: Job description input data encoded with TOON
- **CV Parsing**: CV data compressed before sending to LLM
- **GitHub Analysis**: Profile data optimized with TOON
- **JD Parsing**: Uploaded JD text processed efficiently

## TOON Service Features

### Core Methods

#### `encode_data(data: Any) -> str`
Convert Python objects to TOON format:
```python
# Simple object
toon_service.encode_data({"name": "Alice", "age": 30})
# → "name: Alice\nage: 30"

# Array of objects (tabular format)
toon_service.encode_data([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
])
# → "[2,]{id,name}:\n1,Alice\n2,Bob"
```

#### `decode_data(toon_str: str) -> Any`
Convert TOON format back to Python:
```python
toon_service.decode_data("name: Alice\nage: 30")
# → {"name": "Alice", "age": 30}
```

#### `estimate_token_savings(data: Any) -> Dict`
Analyze token savings:
```python
savings = toon_service.estimate_token_savings(large_data)
# {
#   "json_chars": 1500,
#   "toon_chars": 750,
#   "json_tokens_est": 375,
#   "toon_tokens_est": 187,
#   "savings_chars": 750,
#   "savings_tokens_est": 188,
#   "savings_percent": 50.0
# }
```

### Specialized Methods

#### `encode_cv_data(cv_data: Dict) -> str`
Optimize CV data for parsing:
```python
cv_data = {
    "name": "John Doe",
    "skills": [
        {"skill": "Python", "years": 5},
        {"skill": "React", "years": 3}
    ]
}
toon_service.encode_cv_data(cv_data)
```

#### `encode_jd_input(jd_input: Dict) -> str`
Optimize JD builder form data:
```python
jd_input = {
    "job_title": "Senior Engineer",
    "department": "Engineering",
    "location": "Bangalore"
}
toon_service.encode_jd_input(jd_input)
```

#### `encode_skills_array(skills: list) -> str`
Tabular format for skills:
```python
skills = [
    {"skill": "Python", "proficiency": "expert", "years": 5},
    {"skill": "React", "proficiency": "advanced", "years": 3}
]
toon_service.encode_skills_array(skills)
# → "[2,]{skill,proficiency,years}:\nPython,expert,5\nReact,advanced,3"
```

#### `create_optimized_prompt(instruction, data, output_format) -> str`
Build complete optimized prompt:
```python
prompt = toon_service.create_optimized_prompt(
    instruction="Extract skills from this CV",
    data=cv_data,
    output_format="JSON"
)
```

## Cost Savings

### Example Costs with TOON

Assuming Claude Sonnet 4.5 pricing:
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

**Without TOON:**
- CV Parsing: 2000 input tokens → $0.006
- JD Generation: 800 input tokens → $0.0024

**With TOON (40% savings):**
- CV Parsing: 1200 input tokens → $0.0036 (saves $0.0024 per CV)
- JD Generation: 480 input tokens → $0.00144 (saves $0.00096 per JD)

**At scale (1000 CVs + 100 JDs):**
- Savings: ~$2.50 per 1000 CVs processed
- Savings: ~$0.10 per 100 JDs generated
- **Total monthly savings** (10,000 CVs): ~$25/month

## Usage in Services

### CV Parser

```python
# Automatic TOON optimization
result = await bedrock_service.invoke_claude(
    prompt=CV_PARSING_PROMPT.format(cv_text=cv_text),
    db=db,
    user_id=user_id,
    call_type=LLMCallType.CV_PARSING,
    use_toon=True,  # Automatically enabled
)
```

### JD Builder

```python
# JD input optimized with TOON
result = await bedrock_service.invoke_claude(
    prompt=JD_GENERATION_PROMPT.format(...),
    db=db,
    user_id=user_id,
    call_type=LLMCallType.JD_GENERATION,
    use_toon=True,  # Automatically enabled
)
```

### GitHub Analyzer

```python
# GitHub data compressed with TOON
result = await bedrock_service.invoke_claude(
    prompt=GITHUB_ANALYSIS_PROMPT.format(...),
    db=db,
    user_id=user_id,
    call_type=LLMCallType.GITHUB_ANALYSIS,
    use_toon=True,  # Automatically enabled
)
```

## Fallback Behavior

If TOON library is not installed:
- Graceful fallback to standard JSON
- Warning logged: `"toon_format not installed"`
- All functionality continues to work
- No errors or crashes

## Monitoring Token Savings

Track token usage via LLM stats endpoint:

```bash
curl -X GET "http://localhost:8000/api/v1/jd-builder/llm/stats" \
  -H "Authorization: Bearer <token>"
```

Compare token usage before and after TOON integration.

## Technical Details

### TOON Format Spec

**Simple Objects:**
```
key: value
another_key: another_value
```

**Arrays:**
```
items[3]: apple,banana,orange
```

**Tabular Arrays (Uniform Objects):**
```
[count,]{field1,field2,field3}:
value1,value2,value3
value4,value5,value6
```

**Nested Objects:**
```
parent{
  child: value
  nested{
    deep: value
  }
}
```

## Configuration

### Enable/Disable TOON

TOON is enabled by default. To disable for specific calls:

```python
result = await bedrock_service.invoke_claude(
    prompt=prompt,
    db=db,
    user_id=user_id,
    call_type=LLMCallType.CV_PARSING,
    use_toon=False,  # Disable TOON for this call
)
```

### Check TOON Availability

```python
from app.services.toon_service import toon_service

if toon_service.enabled:
    print("TOON is available and active")
else:
    print("TOON is not installed - using JSON fallback")
```

## Benefits

✅ **30-60% token reduction** compared to JSON
✅ **Lower API costs** for high-volume processing
✅ **Human-readable** format for debugging
✅ **Automatic optimization** across all services
✅ **Graceful fallback** if library unavailable
✅ **No changes required** to existing prompts
✅ **Plug-and-play** integration

## Testing

Test TOON encoding/decoding:

```python
from app.services.toon_service import toon_service

# Test encoding
data = {
    "candidates": [
        {"id": 1, "name": "Alice", "score": 95},
        {"id": 2, "name": "Bob", "score": 87}
    ]
}

toon_encoded = toon_service.encode_data(data)
print("TOON Format:")
print(toon_encoded)

# Test decoding
decoded = toon_service.decode_data(toon_encoded)
print("\nDecoded:")
print(decoded)

# Check savings
savings = toon_service.estimate_token_savings(data)
print(f"\nToken Savings: {savings['savings_percent']}%")
print(f"Estimated tokens saved: {savings['savings_tokens_est']}")
```

## Resources

- **TOON GitHub**: https://github.com/toon-format/toon-python
- **Official Spec**: https://github.com/toon-format/toon
- **PyPI Package**: https://pypi.org/project/toon-python/

## Troubleshooting

### TOON Not Working

1. **Check installation:**
   ```bash
   pip list | grep toon
   ```

2. **Reinstall if needed:**
   ```bash
   pip install --upgrade git+https://github.com/toon-format/toon-python.git
   ```

3. **Check service status:**
   ```python
   from app.services.toon_service import toon_service
   print(toon_service.enabled)  # Should be True
   ```

### Import Errors

If you see `ImportError: No module named 'toon_format'`:

```bash
cd backend
pip install -r requirements.txt
```

### Decoding Errors

If LLM returns invalid TOON:
- Service automatically falls back to JSON parsing
- Error logged for debugging
- No impact on application functionality

## Future Enhancements

- [ ] Custom TOON schemas for domain-specific data
- [ ] TOON compression for large CV batches
- [ ] Real-time token savings dashboard
- [ ] A/B testing TOON vs JSON performance
- [ ] TOON optimization for streaming responses

---

**Implementation Date**: December 5, 2025
**Status**: ✅ Integrated and Active
**Expected Savings**: 30-60% token reduction
