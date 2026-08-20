/**
 * Highcharts Chart Theme System
 *
 * Remaps chart colors and text styles based on the active body class theme.
 * Register themes with ChartTheme.register(bodyClass, config), and the first
 * matching body class becomes the active theme (detected lazily on first use).
 *
 * Usage:
 *   colors: ChartTheme.mapColors(['#8fd385','#868686'])
 *   color:  ChartTheme.mapColor('#777')
 *   style:  ChartTheme.mapStyle({ fontSize: '10px', color: '#777' })
 *
 * Adding a new theme:
 *   ChartTheme.register('my_custom_theme', {
 *     colors: { '#8fd385': '#004D00' },
 *     styles: { fontWeight: '600' }
 *   });
 */
var ChartTheme = (function() {
  var themes = {};
  var activeColors = null;
  var activeStyles = null;
  var detected = false;

  function register(bodyClass, config) {
    themes[bodyClass] = config;
  }

  function detect() {
    if (detected) return;
    var body = document.body;
    if (!body) return;
    for (var cls in themes) {
      if (themes.hasOwnProperty(cls) && body.classList.contains(cls)) {
        activeColors = themes[cls].colors || null;
        activeStyles = themes[cls].styles || null;
        break;
      }
    }
    detected = true;
  }

  function mapColor(hex) {
    detect();
    if (!activeColors || !hex) return hex;
    return activeColors[hex] || activeColors[hex.toLowerCase()] || hex;
  }

  function mapColors(arr) {
    detect();
    if (!activeColors || !arr) return arr;
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      result.push(mapColor(arr[i]));
    }
    return result;
  }

  function mapStyle(styleObj) {
    detect();
    if (!activeStyles) return styleObj;
    var result = {};
    var k;
    if (styleObj) {
      for (k in styleObj) {
        if (styleObj.hasOwnProperty(k)) result[k] = styleObj[k];
      }
    }
    for (k in activeStyles) {
      if (activeStyles.hasOwnProperty(k)) result[k] = activeStyles[k];
    }
    return result;
  }

  return {
    register: register,
    mapColor: mapColor,
    mapColors: mapColors,
    mapStyle: mapStyle
  };
})();

// -- High-contrast theme (WCAG AA) --
ChartTheme.register('high_contrast_theme', {
  colors: {
    '#8fd385': '#357A35',
    '#7dbe73': '#357A35',
    '#5cbfab': '#00695C',
    '#79d7c4': '#00796B',
    '#868686': '#505050',
    '#ca6760': '#B71C1C',
    '#78ba6c': '#357A35',
    '#777':    '#595959',
    '#777777': '#595959',
    '#effded': '#C8E6C9',
    '#abd7fe': '#0D47A1',
    '#ABD7FE': '#0D47A1',
    '#ed1c24': '#B71C1C',
    '#ED1C24': '#B71C1C',
    '#7ec265': '#357A35',
    '#7EC265': '#357A35',
    '#f8b125': '#E65100',
    '#F26A55': '#B71C1C',
    '#f26a55': '#B71C1C',
    '#e1e1e1': '#8C8C8C',
    '#E1E1E1': '#8C8C8C',
    '#e1e1e0': '#8C8C8C',
    '#E1E1E0': '#8C8C8C',
    '#494949': '#1A1A1A',
    '#333333': '#111111'
  },
  styles: {
    fontWeight: '600'
  }
});
