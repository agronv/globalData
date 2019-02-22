import countries from './countries.js';
import products from './filtered.js'; 

export default class Inputs {
  constructor(scene, container, routes, loading, noData) {
    this.scene = scene;
    this.container = container;
    this.routes = routes;
    this.loading = loading;
    this.noData = noData;
    this.proxyUrl = "https://corsproxyglobe.herokuapp.com/";
    this.currentCountry = "usa";
    this.currentCountryName = "United States of America";
    this.currentProduct = "0808";
    this.currentProductName = "Apples";
    this.currentYear = "2017";

    this.countriesList = document.getElementById('countries-list');
    this.productList = document.getElementById('products-list');
    this.yearList = document.getElementById('years-list');
    this.yearInput = document.getElementById("year-input");
    this.productInput = document.getElementById("product-input");
    this.countryInput = document.getElementById("country-input");
    this.searchTitle = document.getElementById("search-query");

    this.initialize = this.initialize.bind(this);
    this.fetchCountry = this.fetchCountry.bind(this);
    this.fetchProduct = this.fetchProduct.bind(this);
    this.fetchYear = this.fetchYear.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.countryInputListener = this.countryInputListener.bind(this);
    this.productInputListener = this.productInputListener.bind(this);
    this.yearInputListener = this.yearInputListener.bind(this);
    this.removeLists = this.removeLists.bind(this);
    this.countryInputClick = this.countryInputClick.bind(this);
    this.productInputClick = this.productInputClick.bind(this);
    this.onCountryKeyDown = this.onCountryKeyDown.bind(this);
    this.onProductKeyDown = this.onProductKeyDown.bind(this);

    this.countryInput.addEventListener("input", this.countryInputListener);
    this.productInput.addEventListener("input", this.productInputListener);
    this.yearInput.addEventListener("input", this.yearInputListener);
    this.container.addEventListener("mouseup", this.removeLists);
    this.countryInput.addEventListener("click", this.countryInputClick);
    this.productInput.addEventListener("click", this.productInputClick);

    this.initialize();
  }

  initialize() {
    let yearLi;
    for (let i = 1997; i < 2018; i++) {
      yearLi = document.createElement('li');
      yearLi.appendChild(document.createTextNode(i));
      yearLi.setAttribute("id", `year-${i}`);
      if (i === 2017) yearLi.className += "active";
      this.yearList.appendChild(yearLi);
      yearLi.addEventListener("click", this.fetchYear);
    }

    this.countryInput.value = this.currentCountryName;
    this.productInput.value = this.currentProductName;
    this.searchTitle.innerText = `${this.currentCountryName} - ${this.currentProductName}`;

    this.fetchData();
  }

  fetchCountry(e) {
    e.preventDefault();
    this.currentCountry = e.target.id;
    this.currentCountryName = e.target.innerText;
    this.countryInput.value = this.currentCountryName;
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }
    this.fetchData();
  }

  fetchProduct(e) {
    e.preventDefault();
    this.currentProduct = e.target.id;
    this.currentProductName = e.target.innerText;
    this.productInput.value = this.currentProductName;
    while (this.productList.firstChild) {
      this.productList.removeChild(this.productList.firstChild);
    }
    this.fetchData();
  }

  fetchYear(e) {
    e.preventDefault();
    let formerActive = document.getElementsByClassName("active");
    if (formerActive.length > 0) formerActive[0].className = "";
    this.yearInput.value = e.target.id.split("-")[1];
    this.currentYear = e.target.id.split("-")[1];
    e.target.className += "active";
    this.fetchData();
  }

  fetchData() {
    this.loading.className = "loader";
    this.noData.className = "";
    this.searchTitle.innerText = `${this.currentCountryName} - ${this.currentProductName}`;

    for (let i = this.scene.children.length - 1; i > 0; i--) {
      this.scene.remove(this.scene.children[i]);
    }

    const url = `https://atlas.media.mit.edu/hs92/import/${this.currentYear}/${this.currentCountry}/show/${this.currentProduct}/`;
    fetch(this.proxyUrl + url).then(response => response.json()).then(myJson => {
      this.routes.createBars(myJson, this.currentCountry);
    });
  }

  generateProductSearch(key) {
    let result = [];
    let productValue;
    Object.keys(products).forEach((productName) => {
      productValue = this.stringKeyValue(productName, key);
      if (productValue) {
        result.push({ value: productValue, name: productName, id: products[productName] });
      }
    });
    return this.quickSort(result);
  }

  generateCountrySearch(key) {
    let result = [];
    let countryValue;
    Object.values(countries).forEach((country) => {
      countryValue = this.stringKeyValue(country.name, key);
      if (countryValue) {
        result.push({ value: countryValue, name: country.name, id: country.abbr });
      }
    });
    return this.quickSort(result);
  }

  countryInputListener(e) {
    window.removeEventListener("keydown", this.onProductKeyDown);
    window.addEventListener("keydown", this.onCountryKeyDown);
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }  
    let countryLis = this.generateCountrySearch(e.target.value);
    let countryLi;
    countryLis.forEach((country) => {
      countryLi = document.createElement('li');
      countryLi.appendChild(document.createTextNode(country.name));
      countryLi.setAttribute("id", country.id);
      countryLi.classList.add("list-item");
      this.countriesList.appendChild(countryLi);
      countryLi.addEventListener("click", this.fetchCountry);
    });
  }

  productInputListener(e) {
    window.removeEventListener("keydown", this.onCountryKeyDown);
    window.addEventListener("keydown", this.onProductKeyDown);
    while (this.productList.firstChild) {
      this.productList.removeChild(this.productList.firstChild);
    }
    let productLis = this.generateProductSearch(e.target.value);
    let productLi;
    productLis.forEach((product) => {
      productLi = document.createElement('li');
      productLi.appendChild(document.createTextNode(product.name));
      productLi.setAttribute("id", product.id);
      productLi.className = "list-item";
      this.productList.appendChild(productLi);
      productLi.addEventListener("click", this.fetchProduct);
    });
  }

  yearInputListener(e) {
    e.preventDefault();
    let formerActive = document.getElementsByClassName("active");
    if (formerActive.length > 0) formerActive[0].className = "";
    let yearLi = document.getElementById(`year-${e.target.value}`);
    yearLi.className += "active";
    this.currentYear = e.target.value;
    this.fetchData();
  }

  removeLists(e) {
    e.preventDefault();
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }
    while (this.productList.firstChild) {
      this.productList.removeChild(this.productList.firstChild);
    }
    this.countryInput.value = this.currentCountryName;
    this.productInput.value = this.currentProductName;
  }

  productInputClick() {
    this.productInput.value = "";
    this.countryInput.value = this.currentCountryName;
    this.listIndex = null;
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }  
  }

  countryInputClick() {
    this.countryInput.value = "";
    this.productInput.value = this.currentProductName;
    this.listIndex = null;
    while (this.productList.firstChild) {
      this.productList.removeChild(this.productList.firstChild);
    }
  }

  onCountryKeyDown(e) {
    if (this.countriesList.childElementCount && [40, 13, 38].includes(e.keyCode)) {
      if (e.keyCode === 40) {
        if (this.listIndex === null) {
          this.listIndex = 0;
          this.listIndex = this.listIndex % this.countriesList.childElementCount;
          this.countriesList.children[this.listIndex].classList.add("active-item");
          this.countryInput.value = this.countriesList.children[this.listIndex].innerText;
        } else {
          this.countriesList.children[this.listIndex].classList.remove("active-item");
          this.listIndex++;
          this.listIndex = this.listIndex % this.countriesList.childElementCount;
          this.countriesList.children[this.listIndex].classList.add("active-item");
          this.countryInput.value = this.countriesList.children[this.listIndex].innerText;
        }
      }
      else if (e.keyCode === 38) {
        if (this.listIndex === null) {
          this.listIndex = this.countriesList.childElementCount - 1;
          this.listIndex = this.listIndex % this.countriesList.childElementCount;
          this.countriesList.children[this.listIndex].classList.add("active-item");
          this.countryInput.value = this.countriesList.children[this.listIndex].innerText;
        } else {
          this.countriesList.children[this.listIndex].classList.remove("active-item");
          if (this.listIndex) {
            this.listIndex--;
          } 
          else {
            this.listIndex = this.countriesList.childElementCount - 1;
          }
          this.listIndex = this.listIndex % this.countriesList.childElementCount;
          this.countriesList.children[this.listIndex].classList.add("active-item");
          this.countryInput.value = this.countriesList.children[this.listIndex].innerText;
        }
      }
      else if (e.keyCode === 13) {
        if (this.listIndex !== null) {
          window.removeEventListener("keydown", this.onCountryKeyDown);
          this.currentCountry = this.countriesList.children[this.listIndex].id;
          this.currentCountryName = this.countriesList.children[this.listIndex].innerText;
          this.countryInput.value = this.currentCountryName;
          while (this.countriesList.firstChild) {
            this.countriesList.removeChild(this.countriesList.firstChild);
          }
          this.fetchData();
        }
        this.listIndex = null;
      }

    } else if (e.valueOf().key.length === 1) {
      this.listIndex = null;
    }
  }

  onProductKeyDown(e) {
    if (this.productList.childElementCount && [40, 13, 38].includes(e.keyCode)) {
      if (e.keyCode === 40) {
        if (this.listIndex === null) {
          this.listIndex = 0;
          this.listIndex = this.listIndex % this.productList.childElementCount;
          this.productList.children[this.listIndex].classList.add("active-item");
          this.productInput.value = this.productList.children[this.listIndex].innerText;
        } else {
          this.productList.children[this.listIndex].classList.remove("active-item");
          this.listIndex++;
          this.listIndex = this.listIndex % this.productList.childElementCount;
          this.productList.children[this.listIndex].classList.add("active-item");
          this.productInput.value = this.productList.children[this.listIndex].innerText;
        }
      }
      else if (e.keyCode === 38) {
        if (this.listIndex === null) {
          this.listIndex = this.productList.childElementCount - 1;
          this.listIndex = this.listIndex % this.productList.childElementCount;
          this.productList.children[this.listIndex].classList.add("active-item");
          this.productInput.value = this.productList.children[this.listIndex].innerText;
        } else {
          this.productList.children[this.listIndex].classList.remove("active-item");
          if (this.listIndex) {
            this.listIndex--;
          }
          else {
            this.listIndex = this.productList.childElementCount - 1;
          }
          this.listIndex = this.listIndex % this.productList.childElementCount;
          this.productList.children[this.listIndex].classList.add("active-item");
          this.productInput.value = this.productList.children[this.listIndex].innerText;
        }
      }
      else if (e.keyCode === 13) {
        if (this.listIndex !== null) {
          window.removeEventListener("keydown", this.onProductKeyDown);
          this.currentProduct = this.productList.children[this.listIndex].id;
          this.currentProductName = this.productList.children[this.listIndex].innerText;
          this.productInput.value = this.currentProductName;
          while (this.productList.firstChild) {
            this.productList.removeChild(this.productList.firstChild);
          }
          this.fetchData();
        }
        this.listIndex = null;
      }

    } else if (e.valueOf().key.length === 1) {
      this.listIndex = null;
    }
  }

  stringKeyValue(string, key) {
    let stringIdx = 0;
    let keyIdx = 0;
    let value = string.length === key.length ? 1 : 0;
    let multiplier = 1;

    function _stringKeyValue() {
      if (keyIdx === key.length) return value;
      if (stringIdx === string.length) return value > 4 ? value : 0;
      if (string[stringIdx].toLowerCase() === key[keyIdx].toLowerCase()) {
        value += multiplier;
        multiplier *= 2;
        keyIdx++;
      }
      else {
        multiplier = Math.floor(multiplier / 2) || 1;
      }
      stringIdx++;
      return _stringKeyValue();
    }

    return _stringKeyValue();
  }

  quickSort(arr) {
    if (arr.length <= 0) return arr;
    let middle = arr[0];
    let left = [];
    let right = [];
    let middler = [];
    arr.forEach((product) => {
      if (product.value < middle.value) {
        right.push(product);
      }
      else if (product.value === middle.value) {
        middler.push(product);
      }
      else {
        left.push(product);
      }
    });
    const leftSorted = this.quickSort(left);
    const rightSorted = this.quickSort(right);
    return leftSorted.concat(middler, rightSorted);
  }
}