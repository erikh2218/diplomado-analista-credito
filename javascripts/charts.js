if (typeof window.createdStudentProgressAriaTable === 'undefined') {
  window.createdStudentProgressAriaTable = false;
}

// Chart configuration templates for performance
if (typeof window.chartConfigs === 'undefined') {
  window.chartConfigs = {};
}

// Initialize chart configuration templates
function initChartConfigs() {
  const baseWidth = $('body').hasClass('section_nav_page') ? 48 : 42;
  const baseHeight = $('body').hasClass('section_nav_page') ? 48 : 42;

  chartConfigs.studentProgress = {
    chart: {
      backgroundColor: 'transparent',
      plotBorderWidth: null,
      plotShadow: false,
      width: baseWidth,
      height: baseHeight,
      margin: [-10,0,-10,0]
    },
    title: { text: null },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '35%',
        borderColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 0,
        states: {
          inactive: { opacity: .8 },
          hover: { enabled: false }
        }
      },
      series: {
        stacking: 'percent',
        animation: false
      }
    },
    legend: { enabled: false },
    credits: { enabled: false }
  };

  chartConfigs.gradesChart = {
    chart: {
      backgroundColor: 'transparent',
      plotBorderWidth: null,
      plotShadow: false,
      width: 42,
      height: 42,
      margin: [-10,0,-10,0]
    },
    title: { text: null },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '35%',
        borderColor: 'rgba(0, 0, 0, .3)',
        borderRadius: 0,
        states: {
          inactive: { opacity: .8 },
          hover: { enabled: false }
        }
      },
      series: {
        stacking: 'percent',
        animation: false
      }
    },
    legend: { enabled: false },
    credits: { enabled: false }
  };

  chartConfigs.masteryChart = {
    chart: {
      backgroundColor: 'transparent',
      plotBorderWidth: null,
      plotShadow: false,
      width: 42,
      height: 42,
      margin: [-10,0,-10,0]
    },
    title: { text: null },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '35%',
        borderColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 0,
        states: {
          inactive: { opacity: .8 },
          hover: { enabled: false }
        }
      },
      series: {
        stacking: 'percent',
        animation: false
      }
    },
    legend: { enabled: false },
    credits: { enabled: false }
  };
}

// Change Dropdown into Paragraph if only 1 option
$(function() {
  $("select").each(function(index) {
    if ($(this).find('option').size() <= 1) {
      $(this).after('<p>' + $(this).find('option').text() + '</p>');
      $(this).hide();
    }
  });

  // Initialize chart configuration templates
  initChartConfigs();
});

// Internal: ensure a Shadow DOM mount for Highcharts to isolate from global CSS
function getHighchartsShadowMount(hostElement, forceBlock) {
  if (!hostElement) return null;

  let shadow = hostElement.shadowRoot;
  if (!shadow) {
    shadow = hostElement.attachShadow({ mode: 'open' });
  }

  let style = shadow.querySelector('style');
  if (!style) {
    style = document.createElement('style');
    shadow.appendChild(style);
  }

  const display = forceBlock ? 'block' : 'inline-block';
  const width = forceBlock ? 'width:100%;' : '';
  style.textContent = ':host{all:initial;display:' + display + ';' + width + '} ' +
    '#hc{width:100%;height:100%;} ' +
    '.highcharts-container .highcharts-background {fill: none;}';

  let mount = shadow.querySelector('#hc');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'hc';
    shadow.appendChild(mount);
  } else {
    mount.innerHTML = '';
  }

  return mount;
}

function resolveChartMount(id, forceBlock) {
  const host = document.getElementById(id);
  if (!host) return null;
  return getHighchartsShadowMount(host, forceBlock);
}

// grades chart

function grades_chart(chart_id, new_data) {
  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  for (let i = 0; i < new_data.length; i++) {
    if (new_data[i].color) new_data[i].color = ChartTheme.mapColor(new_data[i].color);
  }

  requestAnimationFrame(function() {
    const config = $.extend(true, {}, chartConfigs.gradesChart);
    config.chart.renderTo = mount;
    config.series = [{
      type: 'pie',
      name: 'Progress',
      data: new_data,
      dataLabels: {enabled: false}
    }];

    new Highcharts.Chart(config);
  });
}

// game progress pies

function game_progress(chart_id, data, circleWidth) {
  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  let new_data = [];

  for (let i = 0; i < data.length; i++) {
    new_data.push({color: ChartTheme.mapColor(data[i].color), y: data[i].y});
  }

  new Highcharts.Chart({
    chart: {
      renderTo: mount,
      backgroundColor: 'transparent',
      width: circleWidth,
      height: 81,
      margin: [-5,0,-10,0]
    },
    title: {
      text: null
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      pie: {
        innerSize: '75%',
        borderRadius: 0,
        states: {
          hover: {
            halo: {
              size: 0
            }
          }
        }
      }
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'pie',
      name: 'Game progress',
      animation: {
        duration: 600,
        enabled: true
      },
      data: new_data,
      dataLabels: {
        enabled: false
      }
    }],
    credits: {
      enabled: false
    }
  });
}

function game_levels(chart_id, data, circleWidth) {
  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  Highcharts.setOptions({
    colors: ['transparent']
  });

  let new_data = [];

  for (let i = 0; i < data.length; i++) {
    new_data.push({name: data[i].name, y: data[i].y});
  }

  new Highcharts.Chart({
    chart: {
      renderTo: mount,
      backgroundColor: 'transparent',
      width: circleWidth,
      height: 81,
      margin: [-5,0,-10,0]
    },
    title: {
      text: null
    },
    tooltip: {
      useHtml: true,
      style: {
        padding: '3px',
        fontSize: '11px',
        width: (circleWidth - 5) + 'px'
      },
      formatter: function() {
        return this.point.name;
      }
    },
    plotOptions: {
      pie: {
        innerSize: '75%',
        borderRadius: 0,
        states: {
          hover: {
            halo: {
              size: 0
            }
          }
        }
      }
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'pie',
      name: 'Game levels',
      animation: {
        duration: 600,
        enabled: true
      },
      data: new_data,
      dataLabels: {
        enabled: false
      }
    }],
    credits: {
      enabled: false
    }
  });
}

function student_progress(chart_id, new_data) {
  if (!createdStudentProgressAriaTable) {
    Highcharts.Chart.prototype.callbacks.push(function(chart) {
      if (typeof chart.getTable !== 'function') return;
      const div = document.createElement('div');
      $(chart.container).parent().parent().after(div);
      div.innerHTML = chart.getTable();
      chart.renderTo.setAttribute('aria-label', 'Student progress pie chart.');
      chart.renderTo.setAttribute('role', 'img');
      chart.container.setAttribute('aria-hidden', true);
      div.setAttribute('aria-label', 'A tabular view of the data in the chart.');
      div.style.position = 'absolute';
      div.style.left = '-9999em';
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.overflow = 'hidden';
      div.className = 'ariaTable';
    });
    createdStudentProgressAriaTable = true;
  }

  if ($('#' + chart_id).length === 0) return;

  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  for (let i = 0; i < new_data.length; i++) {
    if (new_data[i].color) new_data[i].color = ChartTheme.mapColor(new_data[i].color);
  }

  // Use requestAnimationFrame for smoother rendering
  requestAnimationFrame(function() {
    const config = $.extend(true, {}, chartConfigs.studentProgress);
    config.chart.renderTo = mount;
    config.series = [{
      type: 'pie',
      name: 'Progress',
      data: new_data,
      dataLabels: {enabled: false}
    }];

    new Highcharts.Chart(config);
  });
}

function right_column_student_progress(chart_id, data, diameter, inner_diameter) {
  /* inner_diameter not used */
  if (!createdStudentProgressAriaTable) {
    Highcharts.Chart.prototype.callbacks.push(function(chart) {
      if (typeof chart.getTable !== 'function') return;
      const div = document.createElement('div');
      chart.container.parentNode.appendChild(div);
      div.innerHTML = chart.getTable();
      chart.renderTo.setAttribute('aria-label', 'Progress pie chart.');
      chart.container.setAttribute('aria-hidden', true);
      div.setAttribute('aria-label', 'A tabular view of the data in the chart.');
      div.style.position = 'absolute';
      div.style.left = '-9999em';
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.overflow = 'hidden';
      div.className = 'ariaTable';
    });
    createdStudentProgressAriaTable = true
  }

  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  for (let i = 0; i < data.length; i++) {
    if (data[i].color) data[i].color = ChartTheme.mapColor(data[i].color);
  }

  // margin -9 makes svg fill the whole space - 10 cuts off
  new Highcharts.Chart({
    chart: {
      renderTo: mount,
      backgroundColor: 'transparent',
      plotBorderWidth: null,
      width: diameter,
      height: diameter,
      margin: -9
    },
    title: {
      text: null
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '78%',
        borderColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 0,
        states: {
          inactive: {
            opacity: 1
          },
          hover: {
            enabled:false
          }
        }
      },
      series: {
        stacking: 'percent',
        animation: false
      }
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'pie',
      name: 'Progress',
      data: data,
      dataLabels: {enabled: false},
      animation: {
        duration: 600,
        enabled: true
      },
      states: {
        hover: {
          enabled: false
        }
      }
    }],
    credits: {
      enabled: false
    }
  });
}

// mastery chart

function mastery_chart(chart_id, data) {
  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  for (let i = 0; i < data.length; i++) {
    if (data[i].color) data[i].color = ChartTheme.mapColor(data[i].color);
  }

  requestAnimationFrame(function() {
    const config = $.extend(true, {}, chartConfigs.masteryChart);
    config.chart.renderTo = mount;
    config.series = [{
      type: 'pie',
      name: 'Progress',
      data: data,
      dataLabels: {enabled: false}
    }];

    new Highcharts.Chart(config);
  });
}

function right_column_mastery_donut(chart_id, data, diameter, inner_diameter, margin) {
  if (!createdStudentProgressAriaTable) {
    Highcharts.Chart.prototype.callbacks.push(function(chart) {
      if (typeof chart.getTable !== 'function') return;
      const div = document.createElement('div');
      chart.container.parentNode.appendChild(div);
      div.innerHTML = chart.getTable();
      chart.renderTo.setAttribute('aria-label', 'Mastery pie chart.');
      chart.container.setAttribute('aria-hidden', true);
      div.setAttribute('aria-label', 'A tabular view of the data in the chart.');
      div.style.position = 'absolute';
      div.style.left = '-9999em';
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.overflow = 'hidden';
      div.className = 'ariaTable';
    });
    createdStudentProgressAriaTable = true;
  }

  const mount = resolveChartMount(chart_id);
  if (!mount) return;

  for (let i = 0; i < data.length; i++) {
    if (data[i].color) data[i].color = ChartTheme.mapColor(data[i].color);
  }

  // margin -9 makes svg fill the whole space - 10 cuts off
  new Highcharts.Chart({
    chart: {
      renderTo: mount,
      backgroundColor: 'transparent',
      plotBorderWidth: null,
      plotShadow: false,
      width: diameter,
      height: diameter,
      margin: margin
    },
    title: {
      text: null
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '78%',
        borderColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 0,
        states: {
          inactive: {
            opacity: 1
          },
          hover: {
            enabled:false
          }
        }
      },
      series: {
        stacking: 'percent',
        animation: false
      }
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'pie',
      name: 'Mastery',
      data: data,
      dataLabels: {enabled: false},
      animation: {
        duration: 600,
        enabled: true
      }
    }],
    credits: {
      enabled: false
    }
  });
}

function dashboard_column_chart(marginBottom, chart_id, xAxisValues, maxVal, yAxisName, yAxisValues, chart_type) {
  const mount = resolveChartMount(chart_id, true);
  if (!mount) return;

  Highcharts.Chart.prototype.callbacks.push(function(chart) {
    /* Accessibility */
    chart.renderer.boxWrapper.attr({role: 'img'});
  });
  Highcharts.setOptions({
    colors: ChartTheme.mapColors(['#8fd385'])
  });
  new Highcharts.Chart({
    chart: {
      height: 150,
      renderTo: mount,
      type: (chart_type ? chart_type : 'spline'),
      marginBottom: marginBottom,
      style: {
        fontFamily: '"RobotoLightNew", "Ubuntu", helvetica, sans-serif'
      }
    },
    title: {
      text: null
    },
    xAxis: {
      categories: xAxisValues,
      tickWidth: 1,
      labels: {
        autoRotationLimit: 0,
        style: ChartTheme.mapStyle({
          color: ChartTheme.mapColor("#777"), fontSize: '10px'
        })
      }
    },
    yAxis: {
      max: maxVal,
      allowDecimals: false,
      tickAmount: 3,
      labels: {
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: yAxisName
      }
    },
    plotOptions: {
      column: {
        stacking: 'normal'
      }
    },
    tooltip: {
      formatter: function() {
        return this.y;
      }
    },
    legend: {
      enabled: false
    },
    series: [{
      name: yAxisName,
      data: yAxisValues,
      marker: {
        radius: 3
      },
      fillColor: {
        linearGradient: [0, 0, 0, 150],
        stops: [
          [0, Highcharts.getOptions().colors[0]],
          [1, new Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
        ]
      },
      borderRadiusTopLeft: '3px',
      borderRadiusTopRight: '3px'
    }],
    credits: {
      enabled: false
    }
  });
}

function dashboard_double_chart(marginBottom, chart_id, xAxisValues, colName, colValues, splineName, splineValues) {
  const mount = resolveChartMount(chart_id, true);
  if (!mount) return;

  Highcharts.setOptions({
    colors: ChartTheme.mapColors(['#8fd385','#868686'])
  });
  new Highcharts.Chart({
    chart: {
      height: 150,
      renderTo: mount,
      zoomType: 'xy',
      marginBottom: marginBottom,
      style: {
        fontFamily: '"RobotoLightNew", "Ubuntu", helvetica, sans-serif'
      }
    },
    title: {
      text: null
    },
    xAxis: [{
      categories: xAxisValues,
      crosshair: true,
      tickWidth: 1,
      labels: {
        autoRotationLimit: 0,
        style: ChartTheme.mapStyle({
          color: ChartTheme.mapColor("#777"), fontSize: '10px'
        })
      }
    }],
    yAxis: [{ // Primary yAxis
      labels: {
        format: '{value}',
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: colName,
        style: ChartTheme.mapStyle({
          color: ChartTheme.mapColor('#78ba6c')
        })
      },
      allowDecimals: false
    }, { // Secondary yAxis
      labels: {
        format: '{value}',
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: splineName
      },
      allowDecimals: false,
      opposite: true
    }],
    tooltip: {
      shared: true
    },
    legend: {
      enabled: false
    },
    series: [{
      name: colName,
      data: colValues,
      type: 'spline',
      marker: {
        radius: 3
      },
      fillColor: {
        linearGradient: [0, 0, 0, 150],
        stops: [
          [0, Highcharts.getOptions().colors[0]],
          [1, new Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
        ]
      }
    }, {
      name: splineName,
      type: 'spline',
      yAxis: 1,
      data: splineValues,
    }],
    credits: {
      enabled: false
    }
  });
}

function dashboard_double_error_chart(marginBottom, chart_id, xAxisValues, colName, colValues, splineName, splineValues) {
  const mount = resolveChartMount(chart_id, true);
  if (!mount) return;

  Highcharts.setOptions({
    colors: ChartTheme.mapColors(['#8fd385','#ca6760'])
  });
  new Highcharts.Chart({
    chart: {
      height: 150,
      renderTo: mount,
      zoomType: 'xy',
      marginBottom: marginBottom,
      style: {
        fontFamily: '"RobotoLightNew", "Ubuntu", helvetica, sans-serif'
      }
    },
    title: {
      text: null
    },
    xAxis: [{
      categories: xAxisValues,
      crosshair: true,
      tickWidth: 1,
      labels: {
        autoRotationLimit: 0,
        style: ChartTheme.mapStyle({
          color: ChartTheme.mapColor("#777"), fontSize: '10px'
        })
      }
    }],
    yAxis: [{ // Primary yAxis
      labels: {
        format: '{value}',
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: colName,
        style: ChartTheme.mapStyle({
          color: ChartTheme.mapColor('#78ba6c')
        })
      },
      allowDecimals: false
    }, { // Secondary yAxis
      labels: {
        format: '{value}',
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: splineName,
        style: ChartTheme.mapStyle({
          color: Highcharts.getOptions().colors[1]
        })
      },
      allowDecimals: false,
      opposite: true
    }],
    tooltip: {
      shared: true
    },
    legend: {
      enabled: false
    },
    series: [{
      name: colName,
      data: colValues,
      type: 'spline',
      marker: {
        radius: 3
      },
      fillColor: {
        linearGradient: [0, 0, 0, 150],
        stops: [
          [0, Highcharts.getOptions().colors[0]],
          [1, new Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
        ]
      }
    }, {
      name: splineName,
      type: 'spline',
      yAxis: 1,
      data: splineValues,
    }],
    credits: {
      enabled: false
    }
  });
}

function dashboard_pie_chart(chart_id, pie_name, pie_data) {
  const mount = resolveChartMount(chart_id, true);
  if (!mount) return;

  Highcharts.setOptions({colors: ChartTheme.mapColors(['#8fd385','#7dbe73','#5cbfab','#79d7c4'])});
  new Highcharts.Chart({
    chart: {
      type: 'pie',
      renderTo: mount,
      height: 130,
      margin: [0,0,0,0],
      style: {
        fontFamily: '"RobotoLightNew", "Ubuntu", helvetica, sans-serif'
      }
    },
    title: {
      text: null
    },
    plotOptions: {
      pie: {
        borderColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 0,
        states: {
          hover: {
            halo: {size: 0}
          }
        },
        dataLabels: {
          enabled: true,
          distance: 10,
          useHTML: true,
          style: ChartTheme.mapStyle({
            fontWeight: 'normal', color: ChartTheme.mapColor('#777')
          })
        }
      }
    },
    series: [{
      name: pie_name,
      data: pie_data,
      dataLabels: {enabled: true}
    }],
    credits: {
      enabled: false
    }
  });
}

function dashboard_boxplot_chart(marginBottom, chart_id, xAxisValues, yAxisName, yAxisValues, timeSpan) {
  const mount = resolveChartMount(chart_id, true);
  if (!mount) return;

  Highcharts.setOptions({
    colors: ChartTheme.mapColors(['#8fd385'])
  });

  new Highcharts.Chart({
    chart: {
      height: 150,
      renderTo: mount,
      type: 'boxplot',
      marginBottom: marginBottom,
      style: {
        fontFamily: '"RobotoLightNew", "Ubuntu", helvetica, sans-serif'
      }
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: xAxisValues,
      tickWidth: 1,
      labels: {
        autoRotationLimit: 0,
        style: ChartTheme.mapStyle({
          fontSize: '10px'
        })
      }
    },
    yAxis: {
      min: 0,
      max: 100,
      tickAmount: 3,
      labels: {
        style: ChartTheme.mapStyle({})
      },
      title: {
        text: yAxisName
      }
    },
    plotOptions: {
      boxplot: {
        fillColor: ChartTheme.mapColor('#effded')
      }
    },
    series: [{
      data: yAxisValues,
      tooltip: {
        headerFormat: '',
        pointFormat: 'Max: {point.high}<br>Med: {point.median}<br>Min: {point.low}'
      }
    }],
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    }
  });
}

function dashboard_widget_chart(marginBottom, chart_id, xAxisValues, maxVal, yAxisName, yAxisValues, chart_type) {
  if (chart_type == 'pie') {
    let pie_data = [];

    $.each(xAxisValues, function(i, v) {
      let formatted_v;

      if (v.length > 11) {
        // week view
        formatted_v = v.replace("<br>", " - ");
      } else {
        formatted_v = v.replace("<br>", " ");
      }

      pie_data.push({name: formatted_v, y: yAxisValues[i]});
    });

    $('#' + chart_id).parent().addClass("center_info");

    dashboard_pie_chart(chart_id, yAxisName, pie_data);
  } else {
    dashboard_column_chart(marginBottom, chart_id, xAxisValues, maxVal, yAxisName, yAxisValues, chart_type);
  }
}