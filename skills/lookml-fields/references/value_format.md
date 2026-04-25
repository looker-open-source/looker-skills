---
name: lookml-fields-value-format
description: Guide to using value_format, value_format_name, and specialized formatting in LookML
---

# value_format & value_format_name

These parameters control the display format of data in Looker. They do **not** alter the underlying data value, only how it appears to users.

## Core Concepts

| Parameter | Type | Description | Usage Best Practice |
| :--- | :--- | :--- | :--- |
| `value_format_name` | Named Reference | Applies a pre-defined format (built-in or custom). | **Preferred**. user-friendly, reusable, and consistent. |
| `value_format` | Formatter String | Applies a specific Excel-style format string. | Use for one-off, unique formats not used elsewhere. |
| `named_value_format` | Model Definition | Defines a reusable format that can be referenced by `value_format_name`. | Use to centralize custom formats (e.g., specific currency or large number scaling). |
| `strict_value_format` | Boolean | Disables user-level localization settings for a `named_value_format`. | Use when a specific format (like ID fields) must NEVER be localized. |

### `value_format_name` (Preferred)
Looker provides built-in formats. Generally prefer these for consistency.

**Common Built-in Formats:**
- `decimal_0`, `decimal_1`, `decimal_2`: Number with 0, 1, or 2 decimal places.
- `usd`, `eur`, `gbp`: Currency formats (localized).
- `percent_0`, `percent_1`, `percent_2`: Percentages.
- `id`: Formats as a string, preventing comma separators for IDs.

**Example:**
```lookml
measure: total_revenue {
  type: sum
  sql: ${sale_price} ;;
  value_format_name: usd
}
```

### `value_format`
Accepts an Excel-style formatting string.

**Example:**
```lookml
measure: custom_formatted_value {
  type: number
  sql: ${value} ;;
  value_format: "$#,##0.00;($#,##0.00)" # Postive;Negative format
}
```

## Excel-Style Formatting Reference

Looker uses standard Excel formatting syntax.

| Symbol | Description | Example Pattern | Result (for 1234.56) |
| :--- | :--- | :--- | :--- |
| `0` | Digit placeholder. Displays a digit or a zero if none exists. | `00000` | `01235` |
| `#` | Digit placeholder. Displays a digit or nothing if zero. | `#,##0` | `1,235` |
| `.` | Decimal point. | `0.00` | `1234.56` |
| `,` | Thousands separator. | `#,##0` | `1,235` |
| `%` | Multiples by 100 and adds % symbol. | `0%` | `123456%` |
| `E` | Scientific notation. | `0.00E+00` | `1.23E+03` |
| `;` | Section separator. `Positive;Negative;Zero;Text` | `0.00;(0.00);-` | Standard accounting style |
| `"` | Literal text. | `0 " widgets"` | `1235 widgets` |
| `\` | Escape character. | `\£#,##0` | `£1,235` |

**Common Custom Patterns:**
- **Millions (M):** `0.00,," M"` (e.g., 1,234,567 -> 1.23 M)
- **Thousands (K):** `0.00," K"` (e.g., 1,234 -> 1.23 K)
- **Revenue (USD):** `$#,##0.00`
- **Negative in Parentheses:** `$#,##0.00;($#,##0.00)`

## Localization

Looker localizes number formats (e.g., switching `.` and `,` for decimals/thousands) based on user settings or the admin "Number format" setting.

- **Standard `value_format`**: RESPECTS localization. If a user's locale uses `,` for decimals, Looker will swap the characters in your format string automatically.
- **`strict_value_format: yes`**: IGNORES localization. Checks the "Strict Value Format" flag in `named_value_format`.
    - Use this for IDs, codes, or specific scientific data that should essentially look identical worldwide.

**Example of Strict Formatting:**
```lookml
# In model file
named_value_format: strict_id_format {
  value_format: "00000"
  strict_value_format: yes
}

# In view file
dimension: user_code {
  value_format_name: strict_id_format
}
```

## Fancy Formatting with Liquid

For conditional formatting (colors, icons, logic), `value_format` is insufficient. You must use the `html` parameter with Liquid.

**Note:** The `html` parameter primarily affects the **Data Table** in Looker. It may not render in all visualization types (e.g., Single Value charts might strip HTML unless configured).

### 1. Conditional Color (Traffic Lights)
Changes the text color based on the value.

```lookml
measure: growth_rate {
  type: number
  sql: ${total_revenue} / NULLIF(${prev_revenue}, 0) - 1 ;;
  value_format_name: percent_2
  html:
    {% if value < 0 %}
      <span style="color: darkred;">{{ rendered_value }}</span>
    {% elsif value > 0.1 %}
      <span style="color: darkgreen;">{{ rendered_value }}</span>
    {% else %}
      <span style="color: black;">{{ rendered_value }}</span>
    {% endif %}
  ;;
}
```
*Key:* Use `{{ rendered_value }}` to preserve the `value_format` (e.g., the % symbol). `{{ value }}` outputs the raw number.

### 2. Conditional Icons & Backgrounds
Adds visuals for quick scanning.

```lookml
measure: status_indicator {
  type: string
  sql: ${status} ;;
  html:
    {% if value == 'Complete' %}
      <div style="background-color: #c6efce; color: #006100; border-radius: 4px; padding: 2px 5px; display: inline-block;">
        ✅ {{ value }}
      </div>
    {% elsif value == 'Failed' %}
      <div style="background-color: #ffc7ce; color: #9c0006; border-radius: 4px; padding: 2px 5px; display: inline-block;">
        ❌ {{ value }}
      </div>
    {% else %}
      <div style="background-color: #ffeb9c; color: #9c5700; border-radius: 4px; padding: 2px 5px; display: inline-block;">
        ⚠️ {{ value }}
      </div>
    {% endif %}
  ;;
}
```

### 3. Dynamic Currency via Parameters
Allows users to switch currency symbols dynamically.

```lookml
parameter: currency_selector {
  type: unquoted
  allowed_value: { label: "USD" value: "USD" }
  allowed_value: { label: "EUR" value: "EUR" }
  allowed_value: { label: "GBP" value: "GBP" }
  default_value: "USD"
}

measure: dynamic_revenue {
  type: sum
  sql: ${sale_price} ;;
  # value_format cannot be dynamic, so we use HTML to fake it
  html:
    {% if currency_selector._parameter_value == 'USD' %}
      ${{ rendered_value }}
    {% elsif currency_selector._parameter_value == 'EUR' %}
      €{{ rendered_value }}
    {% else %}
      £{{ rendered_value }}
    {% endif %}
  ;;
  # Use a neutral format for the underlying number
  value_format: "#,##0.00"
}
```

### 4. Advanced: KPIs with Trend Arrows
Combines multiple fields in one cell.

```lookml
measure: revenue_with_trend {
  type: sum
  sql: ${sale_price} ;;
  value_format_name: usd_0
  html:
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span>{{ rendered_value }}</span>
      {% if growth_rate._value > 0 %}
        <span style="color: green; font-size: 10px;">▲ {{ growth_rate._rendered_value }}</span>
      {% elsif growth_rate._value < 0 %}
        <span style="color: red; font-size: 10px;">▼ {{ growth_rate._rendered_value }}</span>
      {% endif %}
    </div>
  ;;
}
```
**Best Practice:** Always check if the referenced measure (e.g., `growth_rate`) is included in the query or valid in the context.

## Troubleshooting

- **Format not applying?** Check if you are using `string` type measures. `value_format` *only* works on numeric types (number, sum, average, int, etc.).
- **HTML not showing?** Some visualizations (like Table (Legacy) or Single Value with specific settings) might strip HTML. Check the "Use full HTML" or similar toggle if available, or switch to the standard Table viz.
- **Sorting issues?** `html` changes the *display*, but sorting usually happens on the underlying `sql` value. This is good! It means your "Fancy" formatting won't break sorting order.
