/**
 * Tokenizer results.
 */ /**
 * Tokenize input string.
 */ function lexer(str) {
  const tokens = [];
  let i = 0;
  while(i < str.length){
    const char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({
        type: "MODIFIER",
        index: i,
        value: str[i++]
      });
      continue;
    }
    if (char === "\\") {
      tokens.push({
        type: "ESCAPED_CHAR",
        index: i++,
        value: str[i++]
      });
      continue;
    }
    if (char === "{") {
      tokens.push({
        type: "OPEN",
        index: i,
        value: str[i++]
      });
      continue;
    }
    if (char === "}") {
      tokens.push({
        type: "CLOSE",
        index: i,
        value: str[i++]
      });
      continue;
    }
    if (char === ":") {
      let name = "";
      let j = i + 1;
      while(j < str.length){
        const code = str.charCodeAt(j);
        if (// `0-9`
        code >= 48 && code <= 57 || // `A-Z`
        code >= 65 && code <= 90 || // `a-z`
        code >= 97 && code <= 122 || // `_`
        code === 95) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name) throw new TypeError(`Missing parameter name at ${i}`);
      tokens.push({
        type: "NAME",
        index: i,
        value: name
      });
      i = j;
      continue;
    }
    if (char === "(") {
      let count = 1;
      let pattern = "";
      let j = i + 1;
      if (str[j] === "?") {
        throw new TypeError(`Pattern cannot start with "?" at ${j}`);
      }
      while(j < str.length){
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError(`Capturing groups are not allowed at ${j}`);
          }
        }
        pattern += str[j++];
      }
      if (count) throw new TypeError(`Unbalanced pattern at ${i}`);
      if (!pattern) throw new TypeError(`Missing pattern at ${i}`);
      tokens.push({
        type: "PATTERN",
        index: i,
        value: pattern
      });
      i = j;
      continue;
    }
    tokens.push({
      type: "CHAR",
      index: i,
      value: str[i++]
    });
  }
  tokens.push({
    type: "END",
    index: i,
    value: ""
  });
  return tokens;
}
/**
 * Parse a string for the raw tokens.
 */ export function parse(str, options = {}) {
  const tokens = lexer(str);
  const { prefixes = "./" } = options;
  const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
  const result = [];
  let key = 0;
  let i = 0;
  let path = "";
  const tryConsume = (type)=>{
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
  };
  const mustConsume = (type)=>{
    const value = tryConsume(type);
    if (value !== undefined) return value;
    const { type: nextType, index } = tokens[i];
    throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
  };
  const consumeText = ()=>{
    let result = "";
    let value;
    while(value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")){
      result += value;
    }
    return result;
  };
  while(i < tokens.length){
    const char = tryConsume("CHAR");
    const name = tryConsume("NAME");
    const pattern = tryConsume("PATTERN");
    if (name || pattern) {
      let prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    const value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    const open = tryConsume("OPEN");
    if (open) {
      const prefix = consumeText();
      const name = tryConsume("NAME") || "";
      const pattern = tryConsume("PATTERN") || "";
      const suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name || (pattern ? key++ : ""),
        pattern: name && !pattern ? defaultPattern : pattern,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
/**
 * Compile a string to a template function for the path.
 */ export function compile(str, options) {
  return tokensToFunction(parse(str, options), options);
}
/**
 * Expose a method for transforming tokens into the path function.
 */ export function tokensToFunction(tokens, options = {}) {
  const reFlags = flags(options);
  const { encode = (x)=>x, validate = true } = options;
  // Compile all the tokens into regexps.
  const matches = tokens.map((token)=>{
    if (typeof token === "object") {
      return new RegExp(`^(?:${token.pattern})$`, reFlags);
    }
  });
  return (data)=>{
    let path = "";
    for(let i = 0; i < tokens.length; i++){
      const token = tokens[i];
      if (typeof token === "string") {
        path += token;
        continue;
      }
      const value = data ? data[token.name] : undefined;
      const optional = token.modifier === "?" || token.modifier === "*";
      const repeat = token.modifier === "*" || token.modifier === "+";
      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError(`Expected "${token.name}" to not repeat, but got an array`);
        }
        if (value.length === 0) {
          if (optional) continue;
          throw new TypeError(`Expected "${token.name}" to not be empty`);
        }
        for(let j = 0; j < value.length; j++){
          const segment = encode(value[j], token);
          if (validate && !matches[i].test(segment)) {
            throw new TypeError(`Expected all "${token.name}" to match "${token.pattern}", but got "${segment}"`);
          }
          path += token.prefix + segment + token.suffix;
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        const segment = encode(String(value), token);
        if (validate && !matches[i].test(segment)) {
          throw new TypeError(`Expected "${token.name}" to match "${token.pattern}", but got "${segment}"`);
        }
        path += token.prefix + segment + token.suffix;
        continue;
      }
      if (optional) continue;
      const typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError(`Expected "${token.name}" to be ${typeOfMessage}`);
    }
    return path;
  };
}
/**
 * Create path match function from `path-to-regexp` spec.
 */ export function match(str, options) {
  const keys = [];
  const re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
/**
 * Create a path match function from `path-to-regexp` output.
 */ export function regexpToFunction(re, keys, options = {}) {
  const { decode = (x)=>x } = options;
  return function(pathname) {
    const m = re.exec(pathname);
    if (!m) return false;
    const { 0: path, index } = m;
    const params = Object.create(null);
    for(let i = 1; i < m.length; i++){
      if (m[i] === undefined) continue;
      const key = keys[i - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i].split(key.prefix + key.suffix).map((value)=>{
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i], key);
      }
    }
    return {
      path,
      index,
      params
    };
  };
}
/**
 * Escape a regular expression string.
 */ function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */ function flags(options) {
  return options && options.sensitive ? "" : "i";
}
/**
 * Pull out keys from a regexp.
 */ function regexpToRegexp(path, keys) {
  if (!keys) return path;
  const groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  let index = 0;
  let execResult = groupsRegex.exec(path.source);
  while(execResult){
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
/**
 * Transform an array into a regexp.
 */ function arrayToRegexp(paths, keys, options) {
  const parts = paths.map((path)=>pathToRegexp(path, keys, options).source);
  return new RegExp(`(?:${parts.join("|")})`, flags(options));
}
/**
 * Create a path regexp from string input.
 */ function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
/**
 * Expose a function for taking tokens and returning a RegExp.
 */ export function tokensToRegexp(tokens, keys, options = {}) {
  const { strict = false, start = true, end = true, encode = (x)=>x, delimiter = "/#?", endsWith = "" } = options;
  const endsWithRe = `[${escapeString(endsWith)}]|$`;
  const delimiterRe = `[${escapeString(delimiter)}]`;
  let route = start ? "^" : "";
  // Iterate over the tokens and create our regexp string.
  for (const token of tokens){
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      const prefix = escapeString(encode(token.prefix));
      const suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys) keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            const mod = token.modifier === "*" ? "?" : "";
            route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
          } else {
            route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += `((?:${token.pattern})${token.modifier})`;
          } else {
            route += `(${token.pattern})${token.modifier}`;
          }
        }
      } else {
        route += `(?:${prefix}${suffix})${token.modifier}`;
      }
    }
  }
  if (end) {
    if (!strict) route += `${delimiterRe}?`;
    route += !options.endsWith ? "$" : `(?=${endsWithRe})`;
  } else {
    const endToken = tokens[tokens.length - 1];
    const isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === undefined;
    if (!strict) {
      route += `(?:${delimiterRe}(?=${endsWithRe}))?`;
    }
    if (!isEndDelimited) {
      route += `(?=${delimiterRe}|${endsWithRe})`;
    }
  }
  return new RegExp(route, flags(options));
}
/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */ export function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp) return regexpToRegexp(path, keys);
  if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vb3B0L2J1aWxkL3JlcG8vLm5ldGxpZnkvZWRnZS1mdW5jdGlvbnMvX19fbmV0bGlmeS1lZGdlLWhhbmRsZXItbWlkZGxld2FyZS9lZGdlLXJ1bnRpbWUvdmVuZG9yL2Rlbm8ubGFuZC94L3BhdGhfdG9fcmVnZXhwQHY2LjIuMS9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRva2VuaXplciByZXN1bHRzLlxuICovXG5pbnRlcmZhY2UgTGV4VG9rZW4ge1xuICB0eXBlOlxuICAgIHwgXCJPUEVOXCJcbiAgICB8IFwiQ0xPU0VcIlxuICAgIHwgXCJQQVRURVJOXCJcbiAgICB8IFwiTkFNRVwiXG4gICAgfCBcIkNIQVJcIlxuICAgIHwgXCJFU0NBUEVEX0NIQVJcIlxuICAgIHwgXCJNT0RJRklFUlwiXG4gICAgfCBcIkVORFwiO1xuICBpbmRleDogbnVtYmVyO1xuICB2YWx1ZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRva2VuaXplIGlucHV0IHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gbGV4ZXIoc3RyOiBzdHJpbmcpOiBMZXhUb2tlbltdIHtcbiAgY29uc3QgdG9rZW5zOiBMZXhUb2tlbltdID0gW107XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IHN0ci5sZW5ndGgpIHtcbiAgICBjb25zdCBjaGFyID0gc3RyW2ldO1xuXG4gICAgaWYgKGNoYXIgPT09IFwiKlwiIHx8IGNoYXIgPT09IFwiK1wiIHx8IGNoYXIgPT09IFwiP1wiKSB7XG4gICAgICB0b2tlbnMucHVzaCh7IHR5cGU6IFwiTU9ESUZJRVJcIiwgaW5kZXg6IGksIHZhbHVlOiBzdHJbaSsrXSB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjaGFyID09PSBcIlxcXFxcIikge1xuICAgICAgdG9rZW5zLnB1c2goeyB0eXBlOiBcIkVTQ0FQRURfQ0hBUlwiLCBpbmRleDogaSsrLCB2YWx1ZTogc3RyW2krK10gfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY2hhciA9PT0gXCJ7XCIpIHtcbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogXCJPUEVOXCIsIGluZGV4OiBpLCB2YWx1ZTogc3RyW2krK10gfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY2hhciA9PT0gXCJ9XCIpIHtcbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogXCJDTE9TRVwiLCBpbmRleDogaSwgdmFsdWU6IHN0cltpKytdIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGNoYXIgPT09IFwiOlwiKSB7XG4gICAgICBsZXQgbmFtZSA9IFwiXCI7XG4gICAgICBsZXQgaiA9IGkgKyAxO1xuXG4gICAgICB3aGlsZSAoaiA8IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGopO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAvLyBgMC05YFxuICAgICAgICAgIChjb2RlID49IDQ4ICYmIGNvZGUgPD0gNTcpIHx8XG4gICAgICAgICAgLy8gYEEtWmBcbiAgICAgICAgICAoY29kZSA+PSA2NSAmJiBjb2RlIDw9IDkwKSB8fFxuICAgICAgICAgIC8vIGBhLXpgXG4gICAgICAgICAgKGNvZGUgPj0gOTcgJiYgY29kZSA8PSAxMjIpIHx8XG4gICAgICAgICAgLy8gYF9gXG4gICAgICAgICAgY29kZSA9PT0gOTVcbiAgICAgICAgKSB7XG4gICAgICAgICAgbmFtZSArPSBzdHJbaisrXTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW5hbWUpIHRocm93IG5ldyBUeXBlRXJyb3IoYE1pc3NpbmcgcGFyYW1ldGVyIG5hbWUgYXQgJHtpfWApO1xuXG4gICAgICB0b2tlbnMucHVzaCh7IHR5cGU6IFwiTkFNRVwiLCBpbmRleDogaSwgdmFsdWU6IG5hbWUgfSk7XG4gICAgICBpID0gajtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjaGFyID09PSBcIihcIikge1xuICAgICAgbGV0IGNvdW50ID0gMTtcbiAgICAgIGxldCBwYXR0ZXJuID0gXCJcIjtcbiAgICAgIGxldCBqID0gaSArIDE7XG5cbiAgICAgIGlmIChzdHJbal0gPT09IFwiP1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFBhdHRlcm4gY2Fubm90IHN0YXJ0IHdpdGggXCI/XCIgYXQgJHtqfWApO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoaiA8IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHN0cltqXSA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICBwYXR0ZXJuICs9IHN0cltqKytdICsgc3RyW2orK107XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyW2pdID09PSBcIilcIikge1xuICAgICAgICAgIGNvdW50LS07XG4gICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyW2pdID09PSBcIihcIikge1xuICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgaWYgKHN0cltqICsgMV0gIT09IFwiP1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBDYXB0dXJpbmcgZ3JvdXBzIGFyZSBub3QgYWxsb3dlZCBhdCAke2p9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcGF0dGVybiArPSBzdHJbaisrXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvdW50KSB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbmJhbGFuY2VkIHBhdHRlcm4gYXQgJHtpfWApO1xuICAgICAgaWYgKCFwYXR0ZXJuKSB0aHJvdyBuZXcgVHlwZUVycm9yKGBNaXNzaW5nIHBhdHRlcm4gYXQgJHtpfWApO1xuXG4gICAgICB0b2tlbnMucHVzaCh7IHR5cGU6IFwiUEFUVEVSTlwiLCBpbmRleDogaSwgdmFsdWU6IHBhdHRlcm4gfSk7XG4gICAgICBpID0gajtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHRva2Vucy5wdXNoKHsgdHlwZTogXCJDSEFSXCIsIGluZGV4OiBpLCB2YWx1ZTogc3RyW2krK10gfSk7XG4gIH1cblxuICB0b2tlbnMucHVzaCh7IHR5cGU6IFwiRU5EXCIsIGluZGV4OiBpLCB2YWx1ZTogXCJcIiB9KTtcblxuICByZXR1cm4gdG9rZW5zO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgZGVsaW1pdGVyIGZvciByZXBlYXQgcGFyYW1ldGVycy4gKGRlZmF1bHQ6IGAnLydgKVxuICAgKi9cbiAgZGVsaW1pdGVyPzogc3RyaW5nO1xuICAvKipcbiAgICogTGlzdCBvZiBjaGFyYWN0ZXJzIHRvIGF1dG9tYXRpY2FsbHkgY29uc2lkZXIgcHJlZml4ZXMgd2hlbiBwYXJzaW5nLlxuICAgKi9cbiAgcHJlZml4ZXM/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgZm9yIHRoZSByYXcgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2Uoc3RyOiBzdHJpbmcsIG9wdGlvbnM6IFBhcnNlT3B0aW9ucyA9IHt9KTogVG9rZW5bXSB7XG4gIGNvbnN0IHRva2VucyA9IGxleGVyKHN0cik7XG4gIGNvbnN0IHsgcHJlZml4ZXMgPSBcIi4vXCIgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGRlZmF1bHRQYXR0ZXJuID0gYFteJHtlc2NhcGVTdHJpbmcob3B0aW9ucy5kZWxpbWl0ZXIgfHwgXCIvIz9cIil9XSs/YDtcbiAgY29uc3QgcmVzdWx0OiBUb2tlbltdID0gW107XG4gIGxldCBrZXkgPSAwO1xuICBsZXQgaSA9IDA7XG4gIGxldCBwYXRoID0gXCJcIjtcblxuICBjb25zdCB0cnlDb25zdW1lID0gKHR5cGU6IExleFRva2VuW1widHlwZVwiXSk6IHN0cmluZyB8IHVuZGVmaW5lZCA9PiB7XG4gICAgaWYgKGkgPCB0b2tlbnMubGVuZ3RoICYmIHRva2Vuc1tpXS50eXBlID09PSB0eXBlKSByZXR1cm4gdG9rZW5zW2krK10udmFsdWU7XG4gIH07XG5cbiAgY29uc3QgbXVzdENvbnN1bWUgPSAodHlwZTogTGV4VG9rZW5bXCJ0eXBlXCJdKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyeUNvbnN1bWUodHlwZSk7XG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiB2YWx1ZTtcbiAgICBjb25zdCB7IHR5cGU6IG5leHRUeXBlLCBpbmRleCB9ID0gdG9rZW5zW2ldO1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFVuZXhwZWN0ZWQgJHtuZXh0VHlwZX0gYXQgJHtpbmRleH0sIGV4cGVjdGVkICR7dHlwZX1gKTtcbiAgfTtcblxuICBjb25zdCBjb25zdW1lVGV4dCA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGxldCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIHdoaWxlICgodmFsdWUgPSB0cnlDb25zdW1lKFwiQ0hBUlwiKSB8fCB0cnlDb25zdW1lKFwiRVNDQVBFRF9DSEFSXCIpKSkge1xuICAgICAgcmVzdWx0ICs9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHdoaWxlIChpIDwgdG9rZW5zLmxlbmd0aCkge1xuICAgIGNvbnN0IGNoYXIgPSB0cnlDb25zdW1lKFwiQ0hBUlwiKTtcbiAgICBjb25zdCBuYW1lID0gdHJ5Q29uc3VtZShcIk5BTUVcIik7XG4gICAgY29uc3QgcGF0dGVybiA9IHRyeUNvbnN1bWUoXCJQQVRURVJOXCIpO1xuXG4gICAgaWYgKG5hbWUgfHwgcGF0dGVybikge1xuICAgICAgbGV0IHByZWZpeCA9IGNoYXIgfHwgXCJcIjtcblxuICAgICAgaWYgKHByZWZpeGVzLmluZGV4T2YocHJlZml4KSA9PT0gLTEpIHtcbiAgICAgICAgcGF0aCArPSBwcmVmaXg7XG4gICAgICAgIHByZWZpeCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHBhdGgpO1xuICAgICAgICBwYXRoID0gXCJcIjtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgICBwcmVmaXgsXG4gICAgICAgIHN1ZmZpeDogXCJcIixcbiAgICAgICAgcGF0dGVybjogcGF0dGVybiB8fCBkZWZhdWx0UGF0dGVybixcbiAgICAgICAgbW9kaWZpZXI6IHRyeUNvbnN1bWUoXCJNT0RJRklFUlwiKSB8fCBcIlwiLFxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IGNoYXIgfHwgdHJ5Q29uc3VtZShcIkVTQ0FQRURfQ0hBUlwiKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHBhdGggKz0gdmFsdWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocGF0aCkge1xuICAgICAgcmVzdWx0LnB1c2gocGF0aCk7XG4gICAgICBwYXRoID0gXCJcIjtcbiAgICB9XG5cbiAgICBjb25zdCBvcGVuID0gdHJ5Q29uc3VtZShcIk9QRU5cIik7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIGNvbnN0IHByZWZpeCA9IGNvbnN1bWVUZXh0KCk7XG4gICAgICBjb25zdCBuYW1lID0gdHJ5Q29uc3VtZShcIk5BTUVcIikgfHwgXCJcIjtcbiAgICAgIGNvbnN0IHBhdHRlcm4gPSB0cnlDb25zdW1lKFwiUEFUVEVSTlwiKSB8fCBcIlwiO1xuICAgICAgY29uc3Qgc3VmZml4ID0gY29uc3VtZVRleHQoKTtcblxuICAgICAgbXVzdENvbnN1bWUoXCJDTE9TRVwiKTtcblxuICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICBuYW1lOiBuYW1lIHx8IChwYXR0ZXJuID8ga2V5KysgOiBcIlwiKSxcbiAgICAgICAgcGF0dGVybjogbmFtZSAmJiAhcGF0dGVybiA/IGRlZmF1bHRQYXR0ZXJuIDogcGF0dGVybixcbiAgICAgICAgcHJlZml4LFxuICAgICAgICBzdWZmaXgsXG4gICAgICAgIG1vZGlmaWVyOiB0cnlDb25zdW1lKFwiTU9ESUZJRVJcIikgfHwgXCJcIixcbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgbXVzdENvbnN1bWUoXCJFTkRcIik7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRva2Vuc1RvRnVuY3Rpb25PcHRpb25zIHtcbiAgLyoqXG4gICAqIFdoZW4gYHRydWVgIHRoZSByZWdleHAgd2lsbCBiZSBjYXNlIHNlbnNpdGl2ZS4gKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqL1xuICBzZW5zaXRpdmU/OiBib29sZWFuO1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGVuY29kaW5nIGlucHV0IHN0cmluZ3MgZm9yIG91dHB1dC5cbiAgICovXG4gIGVuY29kZT86ICh2YWx1ZTogc3RyaW5nLCB0b2tlbjogS2V5KSA9PiBzdHJpbmc7XG4gIC8qKlxuICAgKiBXaGVuIGBmYWxzZWAgdGhlIGZ1bmN0aW9uIGNhbiBwcm9kdWNlIGFuIGludmFsaWQgKHVubWF0Y2hlZCkgcGF0aC4gKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIHZhbGlkYXRlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgc3RyaW5nIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIHRoZSBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZTxQIGV4dGVuZHMgb2JqZWN0ID0gb2JqZWN0PihcbiAgc3RyOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJzZU9wdGlvbnMgJiBUb2tlbnNUb0Z1bmN0aW9uT3B0aW9uc1xuKSB7XG4gIHJldHVybiB0b2tlbnNUb0Z1bmN0aW9uPFA+KHBhcnNlKHN0ciwgb3B0aW9ucyksIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgdHlwZSBQYXRoRnVuY3Rpb248UCBleHRlbmRzIG9iamVjdCA9IG9iamVjdD4gPSAoZGF0YT86IFApID0+IHN0cmluZztcblxuLyoqXG4gKiBFeHBvc2UgYSBtZXRob2QgZm9yIHRyYW5zZm9ybWluZyB0b2tlbnMgaW50byB0aGUgcGF0aCBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb248UCBleHRlbmRzIG9iamVjdCA9IG9iamVjdD4oXG4gIHRva2VuczogVG9rZW5bXSxcbiAgb3B0aW9uczogVG9rZW5zVG9GdW5jdGlvbk9wdGlvbnMgPSB7fVxuKTogUGF0aEZ1bmN0aW9uPFA+IHtcbiAgY29uc3QgcmVGbGFncyA9IGZsYWdzKG9wdGlvbnMpO1xuICBjb25zdCB7IGVuY29kZSA9ICh4OiBzdHJpbmcpID0+IHgsIHZhbGlkYXRlID0gdHJ1ZSB9ID0gb3B0aW9ucztcblxuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgY29uc3QgbWF0Y2hlcyA9IHRva2Vucy5tYXAoKHRva2VuKSA9PiB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoYF4oPzoke3Rva2VuLnBhdHRlcm59KSRgLCByZUZsYWdzKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiAoZGF0YTogUmVjb3JkPHN0cmluZywgYW55PiB8IG51bGwgfCB1bmRlZmluZWQpID0+IHtcbiAgICBsZXQgcGF0aCA9IFwiXCI7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcGF0aCArPSB0b2tlbjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbHVlID0gZGF0YSA/IGRhdGFbdG9rZW4ubmFtZV0gOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBvcHRpb25hbCA9IHRva2VuLm1vZGlmaWVyID09PSBcIj9cIiB8fCB0b2tlbi5tb2RpZmllciA9PT0gXCIqXCI7XG4gICAgICBjb25zdCByZXBlYXQgPSB0b2tlbi5tb2RpZmllciA9PT0gXCIqXCIgfHwgdG9rZW4ubW9kaWZpZXIgPT09IFwiK1wiO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCFyZXBlYXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0b2tlbi5uYW1lfVwiIHRvIG5vdCByZXBlYXQsIGJ1dCBnb3QgYW4gYXJyYXlgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZiAob3B0aW9uYWwpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgRXhwZWN0ZWQgXCIke3Rva2VuLm5hbWV9XCIgdG8gbm90IGJlIGVtcHR5YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3Qgc2VnbWVudCA9IGVuY29kZSh2YWx1ZVtqXSwgdG9rZW4pO1xuXG4gICAgICAgICAgaWYgKHZhbGlkYXRlICYmICEobWF0Y2hlc1tpXSBhcyBSZWdFeHApLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgIGBFeHBlY3RlZCBhbGwgXCIke3Rva2VuLm5hbWV9XCIgdG8gbWF0Y2ggXCIke3Rva2VuLnBhdHRlcm59XCIsIGJ1dCBnb3QgXCIke3NlZ21lbnR9XCJgXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudCArIHRva2VuLnN1ZmZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBjb25zdCBzZWdtZW50ID0gZW5jb2RlKFN0cmluZyh2YWx1ZSksIHRva2VuKTtcblxuICAgICAgICBpZiAodmFsaWRhdGUgJiYgIShtYXRjaGVzW2ldIGFzIFJlZ0V4cCkudGVzdChzZWdtZW50KSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBgRXhwZWN0ZWQgXCIke3Rva2VuLm5hbWV9XCIgdG8gbWF0Y2ggXCIke3Rva2VuLnBhdHRlcm59XCIsIGJ1dCBnb3QgXCIke3NlZ21lbnR9XCJgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudCArIHRva2VuLnN1ZmZpeDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25hbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHR5cGVPZk1lc3NhZ2UgPSByZXBlYXQgPyBcImFuIGFycmF5XCIgOiBcImEgc3RyaW5nXCI7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcIiR7dG9rZW4ubmFtZX1cIiB0byBiZSAke3R5cGVPZk1lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVnZXhwVG9GdW5jdGlvbk9wdGlvbnMge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGRlY29kaW5nIHN0cmluZ3MgZm9yIHBhcmFtcy5cbiAgICovXG4gIGRlY29kZT86ICh2YWx1ZTogc3RyaW5nLCB0b2tlbjogS2V5KSA9PiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBtYXRjaCByZXN1bHQgY29udGFpbnMgZGF0YSBhYm91dCB0aGUgcGF0aCBtYXRjaC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXRjaFJlc3VsdDxQIGV4dGVuZHMgb2JqZWN0ID0gb2JqZWN0PiB7XG4gIHBhdGg6IHN0cmluZztcbiAgaW5kZXg6IG51bWJlcjtcbiAgcGFyYW1zOiBQO1xufVxuXG4vKipcbiAqIEEgbWF0Y2ggaXMgZWl0aGVyIGBmYWxzZWAgKG5vIG1hdGNoKSBvciBhIG1hdGNoIHJlc3VsdC5cbiAqL1xuZXhwb3J0IHR5cGUgTWF0Y2g8UCBleHRlbmRzIG9iamVjdCA9IG9iamVjdD4gPSBmYWxzZSB8IE1hdGNoUmVzdWx0PFA+O1xuXG4vKipcbiAqIFRoZSBtYXRjaCBmdW5jdGlvbiB0YWtlcyBhIHN0cmluZyBhbmQgcmV0dXJucyB3aGV0aGVyIGl0IG1hdGNoZWQgdGhlIHBhdGguXG4gKi9cbmV4cG9ydCB0eXBlIE1hdGNoRnVuY3Rpb248UCBleHRlbmRzIG9iamVjdCA9IG9iamVjdD4gPSAoXG4gIHBhdGg6IHN0cmluZ1xuKSA9PiBNYXRjaDxQPjtcblxuLyoqXG4gKiBDcmVhdGUgcGF0aCBtYXRjaCBmdW5jdGlvbiBmcm9tIGBwYXRoLXRvLXJlZ2V4cGAgc3BlYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoPFAgZXh0ZW5kcyBvYmplY3QgPSBvYmplY3Q+KFxuICBzdHI6IFBhdGgsXG4gIG9wdGlvbnM/OiBQYXJzZU9wdGlvbnMgJiBUb2tlbnNUb1JlZ2V4cE9wdGlvbnMgJiBSZWdleHBUb0Z1bmN0aW9uT3B0aW9uc1xuKSB7XG4gIGNvbnN0IGtleXM6IEtleVtdID0gW107XG4gIGNvbnN0IHJlID0gcGF0aFRvUmVnZXhwKHN0ciwga2V5cywgb3B0aW9ucyk7XG4gIHJldHVybiByZWdleHBUb0Z1bmN0aW9uPFA+KHJlLCBrZXlzLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIG1hdGNoIGZ1bmN0aW9uIGZyb20gYHBhdGgtdG8tcmVnZXhwYCBvdXRwdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdleHBUb0Z1bmN0aW9uPFAgZXh0ZW5kcyBvYmplY3QgPSBvYmplY3Q+KFxuICByZTogUmVnRXhwLFxuICBrZXlzOiBLZXlbXSxcbiAgb3B0aW9uczogUmVnZXhwVG9GdW5jdGlvbk9wdGlvbnMgPSB7fVxuKTogTWF0Y2hGdW5jdGlvbjxQPiB7XG4gIGNvbnN0IHsgZGVjb2RlID0gKHg6IHN0cmluZykgPT4geCB9ID0gb3B0aW9ucztcblxuICByZXR1cm4gZnVuY3Rpb24gKHBhdGhuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBtID0gcmUuZXhlYyhwYXRobmFtZSk7XG4gICAgaWYgKCFtKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCB7IDA6IHBhdGgsIGluZGV4IH0gPSBtO1xuICAgIGNvbnN0IHBhcmFtcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChtW2ldID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBrZXkgPSBrZXlzW2kgLSAxXTtcblxuICAgICAgaWYgKGtleS5tb2RpZmllciA9PT0gXCIqXCIgfHwga2V5Lm1vZGlmaWVyID09PSBcIitcIikge1xuICAgICAgICBwYXJhbXNba2V5Lm5hbWVdID0gbVtpXS5zcGxpdChrZXkucHJlZml4ICsga2V5LnN1ZmZpeCkubWFwKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBkZWNvZGUodmFsdWUsIGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IGRlY29kZShtW2ldLCBrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHBhdGgsIGluZGV4LCBwYXJhbXMgfTtcbiAgfTtcbn1cblxuLyoqXG4gKiBFc2NhcGUgYSByZWd1bGFyIGV4cHJlc3Npb24gc3RyaW5nLlxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcoc3RyOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfC9cXFxcXSkvZywgXCJcXFxcJDFcIik7XG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqL1xuZnVuY3Rpb24gZmxhZ3Mob3B0aW9ucz86IHsgc2Vuc2l0aXZlPzogYm9vbGVhbiB9KSB7XG4gIHJldHVybiBvcHRpb25zICYmIG9wdGlvbnMuc2Vuc2l0aXZlID8gXCJcIiA6IFwiaVwiO1xufVxuXG4vKipcbiAqIE1ldGFkYXRhIGFib3V0IGEga2V5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleSB7XG4gIG5hbWU6IHN0cmluZyB8IG51bWJlcjtcbiAgcHJlZml4OiBzdHJpbmc7XG4gIHN1ZmZpeDogc3RyaW5nO1xuICBwYXR0ZXJuOiBzdHJpbmc7XG4gIG1vZGlmaWVyOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSB0b2tlbiBpcyBhIHN0cmluZyAobm90aGluZyBzcGVjaWFsKSBvciBrZXkgbWV0YWRhdGEgKGNhcHR1cmUgZ3JvdXApLlxuICovXG5leHBvcnQgdHlwZSBUb2tlbiA9IHN0cmluZyB8IEtleTtcblxuLyoqXG4gKiBQdWxsIG91dCBrZXlzIGZyb20gYSByZWdleHAuXG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwKHBhdGg6IFJlZ0V4cCwga2V5cz86IEtleVtdKTogUmVnRXhwIHtcbiAgaWYgKCFrZXlzKSByZXR1cm4gcGF0aDtcblxuICBjb25zdCBncm91cHNSZWdleCA9IC9cXCgoPzpcXD88KC4qPyk+KT8oPyFcXD8pL2c7XG5cbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGV4ZWNSZXN1bHQgPSBncm91cHNSZWdleC5leGVjKHBhdGguc291cmNlKTtcbiAgd2hpbGUgKGV4ZWNSZXN1bHQpIHtcbiAgICBrZXlzLnB1c2goe1xuICAgICAgLy8gVXNlIHBhcmVudGhlc2l6ZWQgc3Vic3RyaW5nIG1hdGNoIGlmIGF2YWlsYWJsZSwgaW5kZXggb3RoZXJ3aXNlXG4gICAgICBuYW1lOiBleGVjUmVzdWx0WzFdIHx8IGluZGV4KyssXG4gICAgICBwcmVmaXg6IFwiXCIsXG4gICAgICBzdWZmaXg6IFwiXCIsXG4gICAgICBtb2RpZmllcjogXCJcIixcbiAgICAgIHBhdHRlcm46IFwiXCIsXG4gICAgfSk7XG4gICAgZXhlY1Jlc3VsdCA9IGdyb3Vwc1JlZ2V4LmV4ZWMocGF0aC5zb3VyY2UpO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtIGFuIGFycmF5IGludG8gYSByZWdleHAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5VG9SZWdleHAoXG4gIHBhdGhzOiBBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICBrZXlzPzogS2V5W10sXG4gIG9wdGlvbnM/OiBUb2tlbnNUb1JlZ2V4cE9wdGlvbnMgJiBQYXJzZU9wdGlvbnNcbik6IFJlZ0V4cCB7XG4gIGNvbnN0IHBhcnRzID0gcGF0aHMubWFwKChwYXRoKSA9PiBwYXRoVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucykuc291cmNlKTtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoYCg/OiR7cGFydHMuam9pbihcInxcIil9KWAsIGZsYWdzKG9wdGlvbnMpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqL1xuZnVuY3Rpb24gc3RyaW5nVG9SZWdleHAoXG4gIHBhdGg6IHN0cmluZyxcbiAga2V5cz86IEtleVtdLFxuICBvcHRpb25zPzogVG9rZW5zVG9SZWdleHBPcHRpb25zICYgUGFyc2VPcHRpb25zXG4pIHtcbiAgcmV0dXJuIHRva2Vuc1RvUmVnZXhwKHBhcnNlKHBhdGgsIG9wdGlvbnMpLCBrZXlzLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUb2tlbnNUb1JlZ2V4cE9wdGlvbnMge1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAgdGhlIHJlZ2V4cCB3aWxsIGJlIGNhc2Ugc2Vuc2l0aXZlLiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIHNlbnNpdGl2ZT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCB0aGUgcmVnZXhwIHdvbid0IGFsbG93IGFuIG9wdGlvbmFsIHRyYWlsaW5nIGRlbGltaXRlciB0byBtYXRjaC4gKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqL1xuICBzdHJpY3Q/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAgdGhlIHJlZ2V4cCB3aWxsIG1hdGNoIHRvIHRoZSBlbmQgb2YgdGhlIHN0cmluZy4gKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIGVuZD86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCB0aGUgcmVnZXhwIHdpbGwgbWF0Y2ggZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmcuIChkZWZhdWx0OiBgdHJ1ZWApXG4gICAqL1xuICBzdGFydD86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmaW5hbCBjaGFyYWN0ZXIgZm9yIG5vbi1lbmRpbmcgb3B0aW1pc3RpYyBtYXRjaGVzLiAoZGVmYXVsdDogYC9gKVxuICAgKi9cbiAgZGVsaW1pdGVyPzogc3RyaW5nO1xuICAvKipcbiAgICogTGlzdCBvZiBjaGFyYWN0ZXJzIHRoYXQgY2FuIGFsc28gYmUgXCJlbmRcIiBjaGFyYWN0ZXJzLlxuICAgKi9cbiAgZW5kc1dpdGg/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBFbmNvZGUgcGF0aCB0b2tlbnMgZm9yIHVzZSBpbiB0aGUgYFJlZ0V4cGAuXG4gICAqL1xuICBlbmNvZGU/OiAodmFsdWU6IHN0cmluZykgPT4gc3RyaW5nO1xufVxuXG4vKipcbiAqIEV4cG9zZSBhIGZ1bmN0aW9uIGZvciB0YWtpbmcgdG9rZW5zIGFuZCByZXR1cm5pbmcgYSBSZWdFeHAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbnNUb1JlZ2V4cChcbiAgdG9rZW5zOiBUb2tlbltdLFxuICBrZXlzPzogS2V5W10sXG4gIG9wdGlvbnM6IFRva2Vuc1RvUmVnZXhwT3B0aW9ucyA9IHt9XG4pIHtcbiAgY29uc3Qge1xuICAgIHN0cmljdCA9IGZhbHNlLFxuICAgIHN0YXJ0ID0gdHJ1ZSxcbiAgICBlbmQgPSB0cnVlLFxuICAgIGVuY29kZSA9ICh4OiBzdHJpbmcpID0+IHgsXG4gICAgZGVsaW1pdGVyID0gXCIvIz9cIixcbiAgICBlbmRzV2l0aCA9IFwiXCIsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBlbmRzV2l0aFJlID0gYFske2VzY2FwZVN0cmluZyhlbmRzV2l0aCl9XXwkYDtcbiAgY29uc3QgZGVsaW1pdGVyUmUgPSBgWyR7ZXNjYXBlU3RyaW5nKGRlbGltaXRlcil9XWA7XG4gIGxldCByb3V0ZSA9IHN0YXJ0ID8gXCJeXCIgOiBcIlwiO1xuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKGVuY29kZSh0b2tlbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVmaXggPSBlc2NhcGVTdHJpbmcoZW5jb2RlKHRva2VuLnByZWZpeCkpO1xuICAgICAgY29uc3Qgc3VmZml4ID0gZXNjYXBlU3RyaW5nKGVuY29kZSh0b2tlbi5zdWZmaXgpKTtcblxuICAgICAgaWYgKHRva2VuLnBhdHRlcm4pIHtcbiAgICAgICAgaWYgKGtleXMpIGtleXMucHVzaCh0b2tlbik7XG5cbiAgICAgICAgaWYgKHByZWZpeCB8fCBzdWZmaXgpIHtcbiAgICAgICAgICBpZiAodG9rZW4ubW9kaWZpZXIgPT09IFwiK1wiIHx8IHRva2VuLm1vZGlmaWVyID09PSBcIipcIikge1xuICAgICAgICAgICAgY29uc3QgbW9kID0gdG9rZW4ubW9kaWZpZXIgPT09IFwiKlwiID8gXCI/XCIgOiBcIlwiO1xuICAgICAgICAgICAgcm91dGUgKz0gYCg/OiR7cHJlZml4fSgoPzoke3Rva2VuLnBhdHRlcm59KSg/OiR7c3VmZml4fSR7cHJlZml4fSg/OiR7dG9rZW4ucGF0dGVybn0pKSopJHtzdWZmaXh9KSR7bW9kfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlICs9IGAoPzoke3ByZWZpeH0oJHt0b2tlbi5wYXR0ZXJufSkke3N1ZmZpeH0pJHt0b2tlbi5tb2RpZmllcn1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodG9rZW4ubW9kaWZpZXIgPT09IFwiK1wiIHx8IHRva2VuLm1vZGlmaWVyID09PSBcIipcIikge1xuICAgICAgICAgICAgcm91dGUgKz0gYCgoPzoke3Rva2VuLnBhdHRlcm59KSR7dG9rZW4ubW9kaWZpZXJ9KWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlICs9IGAoJHt0b2tlbi5wYXR0ZXJufSkke3Rva2VuLm1vZGlmaWVyfWA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb3V0ZSArPSBgKD86JHtwcmVmaXh9JHtzdWZmaXh9KSR7dG9rZW4ubW9kaWZpZXJ9YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgaWYgKCFzdHJpY3QpIHJvdXRlICs9IGAke2RlbGltaXRlclJlfT9gO1xuXG4gICAgcm91dGUgKz0gIW9wdGlvbnMuZW5kc1dpdGggPyBcIiRcIiA6IGAoPz0ke2VuZHNXaXRoUmV9KWA7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZW5kVG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgIGNvbnN0IGlzRW5kRGVsaW1pdGVkID1cbiAgICAgIHR5cGVvZiBlbmRUb2tlbiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IGRlbGltaXRlclJlLmluZGV4T2YoZW5kVG9rZW5bZW5kVG9rZW4ubGVuZ3RoIC0gMV0pID4gLTFcbiAgICAgICAgOiBlbmRUb2tlbiA9PT0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKCFzdHJpY3QpIHtcbiAgICAgIHJvdXRlICs9IGAoPzoke2RlbGltaXRlclJlfSg/PSR7ZW5kc1dpdGhSZX0pKT9gO1xuICAgIH1cblxuICAgIGlmICghaXNFbmREZWxpbWl0ZWQpIHtcbiAgICAgIHJvdXRlICs9IGAoPz0ke2RlbGltaXRlclJlfXwke2VuZHNXaXRoUmV9KWA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAocm91dGUsIGZsYWdzKG9wdGlvbnMpKTtcbn1cblxuLyoqXG4gKiBTdXBwb3J0ZWQgYHBhdGgtdG8tcmVnZXhwYCBpbnB1dCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgUGF0aCA9IHN0cmluZyB8IFJlZ0V4cCB8IEFycmF5PHN0cmluZyB8IFJlZ0V4cD47XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZywgcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEFuIGVtcHR5IGFycmF5IGNhbiBiZSBwYXNzZWQgaW4gZm9yIHRoZSBrZXlzLCB3aGljaCB3aWxsIGhvbGQgdGhlXG4gKiBwbGFjZWhvbGRlciBrZXkgZGVzY3JpcHRpb25zLiBGb3IgZXhhbXBsZSwgdXNpbmcgYC91c2VyLzppZGAsIGBrZXlzYCB3aWxsXG4gKiBjb250YWluIGBbeyBuYW1lOiAnaWQnLCBkZWxpbWl0ZXI6ICcvJywgb3B0aW9uYWw6IGZhbHNlLCByZXBlYXQ6IGZhbHNlIH1dYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGhUb1JlZ2V4cChcbiAgcGF0aDogUGF0aCxcbiAga2V5cz86IEtleVtdLFxuICBvcHRpb25zPzogVG9rZW5zVG9SZWdleHBPcHRpb25zICYgUGFyc2VPcHRpb25zXG4pIHtcbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiByZWdleHBUb1JlZ2V4cChwYXRoLCBrZXlzKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHJldHVybiBhcnJheVRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpO1xuICByZXR1cm4gc3RyaW5nVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0NBRUMsR0FlRDs7Q0FFQyxHQUNELFNBQVMsTUFBTSxHQUFXO0VBQ3hCLE1BQU0sU0FBcUIsRUFBRTtFQUM3QixJQUFJLElBQUk7RUFFUixNQUFPLElBQUksSUFBSSxNQUFNLENBQUU7SUFDckIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxFQUFFO0lBRW5CLElBQUksU0FBUyxPQUFPLFNBQVMsT0FBTyxTQUFTLEtBQUs7TUFDaEQsT0FBTyxJQUFJLENBQUM7UUFBRSxNQUFNO1FBQVksT0FBTztRQUFHLE9BQU8sR0FBRyxDQUFDLElBQUk7TUFBQztNQUMxRDtJQUNGO0lBRUEsSUFBSSxTQUFTLE1BQU07TUFDakIsT0FBTyxJQUFJLENBQUM7UUFBRSxNQUFNO1FBQWdCLE9BQU87UUFBSyxPQUFPLEdBQUcsQ0FBQyxJQUFJO01BQUM7TUFDaEU7SUFDRjtJQUVBLElBQUksU0FBUyxLQUFLO01BQ2hCLE9BQU8sSUFBSSxDQUFDO1FBQUUsTUFBTTtRQUFRLE9BQU87UUFBRyxPQUFPLEdBQUcsQ0FBQyxJQUFJO01BQUM7TUFDdEQ7SUFDRjtJQUVBLElBQUksU0FBUyxLQUFLO01BQ2hCLE9BQU8sSUFBSSxDQUFDO1FBQUUsTUFBTTtRQUFTLE9BQU87UUFBRyxPQUFPLEdBQUcsQ0FBQyxJQUFJO01BQUM7TUFDdkQ7SUFDRjtJQUVBLElBQUksU0FBUyxLQUFLO01BQ2hCLElBQUksT0FBTztNQUNYLElBQUksSUFBSSxJQUFJO01BRVosTUFBTyxJQUFJLElBQUksTUFBTSxDQUFFO1FBQ3JCLE1BQU0s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
// denoCacheMetadata=7754584442404784894,11296855728745039012