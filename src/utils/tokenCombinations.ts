//    "START-TOKEN-BASED" improved?
// maybe sort by length makes sense.
// first individual words matches.
//         1   das
//         -   das
// then:   5   das licht spiegelt sich in
// no limit-   das licht spiegelt sich in
//         4   das licht spiegelt sich
//         -   das licht spiegelt sich
//         4   das licht spiegelt      in
//         -   das licht spiegelt      in
//         4   das licht          sich in
//         -   das licht          sich in
//         4   das       spiegelt sich in
//         -   das       spiegelt sich in
//         3   das licht spiegelt
//         -   das licht spiegelt
//         3   das licht          sich
//         -   das licht          sich
//         3   das licht               in
//         -   das licht               in
//         3   das       spiegelt sich
//         -   das       spiegelt sich
//         3   das       spiegelt      in
//         -   das       spiegelt      in
//         3   das                sich in
//         2   das licht
//         -   das licht
//         2   das       spiegelt
//         -   das       spiegelt
//         2   das                sich
//         -   das                sich
//         2   das                     in
//         -   das                     in

export function getTokenCombinations<T>(tokens: T[]) {
  return [
    ...getCombinations(tokens.slice(1))
      .sort((a, b) => b.length - a.length)
      .map((ts) => [tokens[0], ...ts]),
    [tokens[0]],
  ]
}

function getCombinations<T>(items: T[]) {
  var result: T[][] = []
  var f = function (prefix: T[], items: T[]) {
    for (var i = 0; i < items.length; i++) {
      result.push([...prefix, items[i]])
      f([...prefix, items[i]], items.slice(i + 1))
    }
  }
  f([], items)
  return result
}
