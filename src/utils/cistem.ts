// MIT License

// Copyright (c) 2017 Leonie Weißweiler

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
/**
 * CISTEM Stemmer for German
 *
 * This is the official Javascript implementation of the CISTEM stemmer.
 * It is based on the paper
 * Leonie Weißweiler, Alexander Fraser (2017). Developing a Stemmer for German Based on a Comparative Analysis of Publicly Available Stemmers. In Proceedings of the German Society for Computational Linguistics and Language Technology (GSCL)
 * which can be read here:
 * http://www.cis.lmu.de/~weissweiler/cistem/
 *
 * In the paper, we conducted an analysis of publicly available stemmers, developed
 * two gold standards for German stemming and evaluated the stemmers based on the
 * two gold standards. We then proposed the stemmer implemented here and show
 * that it achieves slightly better f-measure than the other stemmers and is
 * thrice as fast as the Snowball stemmer for German while being about as fast as
 * most other stemmers.
 */

const stripge = /^ge(.{4,})/
const replxx = /(.)\1/g
const replxxback = /(.)\*/g
const replü = /ü/g
const replö = /ö/g
const replä = /ä/g
const replß = /ß/g
const replsch = /sch/g
const replei = /ei/g
const replie = /ie/g
const replschback = /\$/g
const repleiback = /%/g
const replieback = /&/g
const stripemr = /e[mr]$/
const stripnd = /nd$/
const stript = /t$/
const stripesn = /[esn]$/

/**
 * This method takes the word to be stemmed and a boolean specifiying if case-insensitive stemming should be used and returns the stemmed word. If only the word
 * is passed to the method or the second parameter is 0, normal case-sensitive stemming is used, if the second parameter is 1, case-insensitive stemming is used.
 * Case sensitivity improves performance only if words in the text may be incorrectly upper case.
 * For all-lowercase and correctly cased text, best performance is achieved by
 * using the case-sensitive version.
 * @param {String} word
 * @param {boolean} case_insensitive
 * @returns {String}
 */
export function stem(word: string, case_insensitive = false) {
  if (word.length == 0) return word

  const upper = word[0] === word[0].toUpperCase()
  word = word.toLowerCase()

  word = word.replace(replü, 'u')
  word = word.replace(replö, 'o')
  word = word.replace(replä, 'a')
  word = word.replace(replß, 'ss')

  word = word.replace(stripge, '$1')
  word = word.replace(replsch, '$')
  word = word.replace(replei, '%')
  word = word.replace(replie, '&')
  word = word.replace(replxx, '$1*')

  while (word.length > 3) {
    let result

    if (word.length > 5) {
      result = word.replace(stripemr, '')
      if (result !== word) {
        word = result
        continue
      }

      result = word.replace(stripnd, '')
      if (result !== word) {
        word = result
        continue
      }
    }

    if (!upper || case_insensitive) {
      result = word.replace(stript, '')
      if (result !== word) {
        word = result
        continue
      }
    }

    result = word.replace(stripesn, '')
    if (result !== word) {
      word = result
      continue
    } else {
      break
    }
  }

  word = word.replace(replxxback, '$1$1')
  word = word.replace(repleiback, 'ei')
  word = word.replace(replieback, 'ie')
  word = word.replace(replschback, 'sch')

  return word
}

/**
 * This method works very similarly to stem. The only difference is that in
 * addition to returning the stem, it also returns the rest that was removed at
 * the end. To be able to return the stem unchanged so the stem and the rest
 * can be concatenated to form the original word, all subsitutions that altered
 * the stem in any other way than by removing letters at the end were left out.
 * @param {String} word
 * @param {boolean} case_insensitive
 * @returns {Array<String>}
 */
export function segment(word: string, case_insensitive = false) {
  if (word.length == 0) return ['', '']

  let rest_length = 0
  const upper = word[0] === word[0].toUpperCase()
  word = word.toLowerCase()

  let original = word

  word = word.replace(replsch, '$')
  word = word.replace(replei, '%')
  word = word.replace(replie, '&')
  word = word.replace(replxx, '$1*')

  while (word.length > 3) {
    let result

    if (word.length > 5) {
      result = word.replace(stripemr, '')

      if (result !== word) {
        word = result
        rest_length += 2
        continue
      }

      result = word.replace(stripnd, '')
      if (result !== word) {
        word = result
        rest_length += 2
        continue
      }
    }

    if (!upper || case_insensitive) {
      result = word.replace(stript, '')

      if (result !== word) {
        word = result
        rest_length += 1
        continue
      }
    }

    result = word.replace(stripesn, '')
    if (result !== word) {
      word = result
      rest_length += 1
      continue
    } else {
      break
    }
  }

  word = word.replace(replxxback, '$1$1')
  word = word.replace(repleiback, 'ei')
  word = word.replace(replieback, 'ie')
  word = word.replace(replschback, 'sch')

  let rest
  if (rest_length > 0) {
    rest = original.substr(original.length - rest_length)
  } else {
    rest = ''
  }

  return [word, rest]
}
