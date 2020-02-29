// 返回 min 和 max（包含） 之间的随机数
function getRandomInt (min, max) {
  // floor 为向下取整
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle (arr) {
  // copy一份 数组, 不修改原有的array
  let _arr = arr.slice()
  for (let i = 0; i < _arr.length; i++) {
    // 获取随机数
    let j = getRandomInt(0, i)
    let t = _arr[i]
    // 根据随机索引交换值
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}
// 节流函数,  返回一个函数对象
export function debounce (func, delay) {
  let timer

  return function (...args) {
    /*
    多次调用该函数，则 只会调用一次
     已经执行过, 则清除之前的定时器，重新计时执行
    */
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}