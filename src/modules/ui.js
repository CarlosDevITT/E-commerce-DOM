import { searchProducts, sortProducts } from './products.js'

export function initUI() {

  const search = document.getElementById('search-input')
  search.addEventListener('input', e => {
    searchProducts(e.target.value)
  })

  const sort = document.getElementById('sort')
  sort.addEventListener('change', e => {
    sortProducts(e.target.value)
  })

}