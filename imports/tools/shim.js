 // Add Google Chrome-like function
 // https://stackoverflow.com/a/8812157/1927589

if (!window.location.getParameter) {
  window.location.getParameter = function(key) {
    function parseParams() {
        const params = {}

        const searchString = window.location.search
                                   .toLowerCase()
                                   .substring(1);
        const regex = /([^&=]+)=?([^&]*)/g
        const plusToSpace = /\+/g
        const decode = string => (
          decodeURIComponent(
            string.replace(plusToSpace, " ")
          )
        )
        let match

        while (match = regex.exec(searchString)) {
          const key = decode(match[1])
          const value = decode(match[2])

          params[key] = value
        }

        return params;
    }

    if (!this.queryStringParams) {
      this.queryStringParams = parseParams()
    }

    return this.queryStringParams[key];
  }
}