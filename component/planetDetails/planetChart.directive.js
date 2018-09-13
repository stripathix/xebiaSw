/*jslint browser:true*/
/*global angular, d3*/
angular.module("xebiaSwApp")
    .directive("planetChart", [function () {
        "use strict";
        return {
            restrict: "E",
            template: "<div id='planetChartContainer' class='svg-container'></div>",
            scope: {
                chartApi: "="
            },
            link: function (scope) {
              scope.chartApi = {};
              var solar = [];
              var timers = [];
              function cleanTimers() {
                  //clean old timers before drawing
                  angular.forEach(timers, function (timer) {
                     timer.stop();
                  });
                  timers = [];
              }
              function drawPlanets() {
                  cleanTimers();
                  if (!solar.length) {
                      return;
                  }
                  var margin = {top: 100, right: 50, bottom: 100, left: 50};
                  var dimension = {
                      width: window.innerWidth,
                      height: 300
                  };
                  var i;
                  var width = dimension.width - margin.left - margin.right;
                  var height = dimension.height - margin.top - margin.bottom;
                  d3.select("#planetChartContainer svg").remove();
                  var svg = d3.select("#planetChartContainer").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                  var starArea = d3.select("svg").append("g");

                  var config = {
                    padding: 10,
                    axisMultiplier: 1.4,
                    velocity: [0.01, 0],
                    starRadius: 1,
                    glowRadius: 2
                  };

                  var definitions = d3.select("svg").append("defs");
                  var filter = definitions.append("filter")
                    .attr("id", "glow");
                  filter.append("feGaussianBlur")
                    .attr("class", "blur")
                    .attr("stdDeviation", config.glowRadius)
                    .attr("result","coloredBlur");
                  var feMerge = filter.append("feMerge");
                  feMerge.append("feMergeNode")
                    .attr("in","coloredBlur");
                  feMerge.append("feMergeNode")
                    .attr("in","SourceGraphic");

                  function generateStars(number) {
                    var stars = starArea.selectAll("circle")
                      .data(d3.range(number).map(d =>
                         i = {x: Math.random() * (width + margin.left + margin.right), y: Math.random() * (height + margin.top + margin.bottom), r: Math.random() * config.starRadius}
                      ))
                      .enter().append("circle")
                        .attr("class", "star")
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                        .attr("r", d => d.r);
                  }

                  function displayPlanets(cfg, planets) {
                    var boundingSize = Math.min((width / planets.length) - cfg.padding, dimension.height / 2);
                    var boundingArea = svg.append("g")
                      .selectAll("g")
                      .data(planets)
                      .enter().append("g")
                        .attr("transform", (d, i) => "translate(" + [i * (boundingSize + cfg.padding), height / 2] + ")")
                        .on("mouseover", showInfo)
                        .on("mouseout", hideInfo);

                    var boundingRect = boundingArea.append("rect")
                      .attr("class", "bounding-box")
                      .attr("y", -boundingSize / 2)
                      .attr("width", boundingSize)
                      .attr("height", boundingSize);

                    var info = boundingArea.append("g")
                      .attr("transform", "translate(" + [0, (boundingSize / 2) + 18] + ")")
                      .attr("class", "info")
                      .style("opacity", 0);
                    info.append("text")
                      .text(d => "Diameter: " + d.diameter + "km");
                    info.append("text")
                      .attr("y", 12)
                      .text(d => "Population: " + d.population);
                    info.append("text")
                      .attr("y", 24)
                      .text(d => "Rotaion: " + d.rotation_period);

                    var labels = boundingArea.append("text")
                      .attr("class", "label")
                      .attr("y", -boundingSize / 2)
                      .attr("dy", -12)
                      .text(d => d.name);

                    var radiusScale = d3.scaleLinear()
                      .domain([0, d3.max(planets, d => d.radius)])
                      .range([0, (boundingSize / 2) - 3]);

                    var graticuleScale = d3.scaleLinear()
                      .domain(d3.extent(planets, d => d.radius))
                      .range([20, 10]);

                    var planets = boundingArea.each(function(d) {
                      var x = d3.select(this);
                      drawPlanet(x, d);
                    });

                    function drawPlanet(element, data) {

                      var rotation = [0, 0, data.tilt];

                      var projection = d3.geoOrthographic()
                        .translate([0, 0])
                        .scale(radiusScale(data.radius))
                        .clipAngle(90)
                        .precision(0.1);

                      var path = d3.geoPath()
                        .projection(projection);

                      var graticule = d3.geoGraticule();

                      var planet = element.append("g")
                        .attr("class", "planet")
                        .attr("transform", "translate(" + [boundingSize / 2, 0] + ")");

                      var defs = d3.select("svg").select("defs");
                      var gradient = defs.append("radialGradient")
                        .attr("id", "gradient" + data.key)
                        .attr("cx", "25%")
                        .attr("cy", "25%");

                      // The offset at which the gradient starts
                      gradient.append("stop")
                        .attr("offset", "5%")
                        .attr("stop-color", data.colours[0]);

                      // The offset at which the gradient ends
                      gradient.append("stop")
                        .attr("offset", "100%")
                        .attr("stop-color", data.colours[1]);

                      var axis = planet.append("line")
                        .attr("class", "axis-line")
                        .attr("x1", -radiusScale(data.radius) * cfg.axisMultiplier)
                        .attr("x2", radiusScale(data.radius) * cfg.axisMultiplier)
                        .attr("transform", "rotate(" + (90 - data.tilt) + ")");

                      var fill = planet.append("circle")
                      .attr("r", radiusScale(data.radius))
                      .style("fill", "url(#gradient" + data.key + ")")
                      .style("filter", "url(#glow)");

                      var gridLines = planet.append("path")
                      .attr("class", "graticule")
                      .datum(graticule.step([graticuleScale(data.radius), graticuleScale(data.radius)]))
                      .attr("d", path);

                      var timer = d3.timer(function(elapsed) {
                        // Rotate projection
                        projection.rotate([rotation[0] + elapsed * cfg.velocity[0] / data.period, rotation[1] + elapsed * cfg.velocity[1] / data.period, rotation[2]]);
                        // Redraw gridlines
                        gridLines.attr("d", path);
                      });
                      timers.push(timer);
                    }
                  }

                  function showInfo(d) {
                    d3.select(this).select("g.info")
                      .transition()
                      .style("opacity", 1);
                  }

                  function hideInfo(d) {
                    d3.select(this).select("g.info")
                      .transition()
                      .style("opacity", 0);
                  }

                  generateStars(500);
                  displayPlanets(config, solar);

                  starArea.lower();
              }
              scope.chartApi.refresh = function (planets) {
                  solar = planets;
                  drawPlanets();
              };
              window.addEventListener("resize", drawPlanets);
            }
        };
    }]);
