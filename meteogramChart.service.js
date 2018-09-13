/*jslint browser:true, es6*/
import bnd3Service from "@/services/bnd3.service.js";
import tempChartService from "@/components/Meteogram/service/tempChart.service.js";
import windChartService from "@/components/Meteogram/service/windChart.service.js";
import ceilingChartService from "@/components/Meteogram/service/ceilingChart.service.js";
import precepitationChartService from "@/components/Meteogram/service/precepitationChart.service.js";
import xAxisMeteogramService from "@/components/Meteogram/service/xAxis.service.js";
import trackLineService from "@/components/Meteogram/service/trackLine.service.js";
import utilityService from "@/services/utility.service.js";
import ChartConst from "@/constants/chart.constant.js";
import spinnerService from "@/services/spinner.service.js";
import AppConst from "@/constants/app.constant.js";
import DefConst from "@/constants/def.constant.js";
import bnChartDataProcessService from "@/services/chartDataProcess.service.js";
import bnChartDataService from "@/services/chartData.service.js";
import underscore from "underscore";
import d3 from "@/globalexports/d3.export.js";
var meteogramChartService = function () {
    var content = {};
    content.chartApi = {};
    content.chartData = null;
    content.completeData = null;
    content.chartAloftData = null;
    content.chartNoDataForAloftAvailable = null;
    content.settings = null;
    content.getNoDataMessage = function (fullData, settings) {
        var noDataMessage = "Data not available";
        if (settings && (fullData.mav.forecast || fullData.lamp.forecast)) {
            switch (settings.product) {
            case ChartConst.products.twelvehours.name:
            case ChartConst.products.lamp.name:
                if (fullData.mav.forecast) {
                    noDataMessage += " for " + ChartConst.products.twelvehours.display_name + " and " + ChartConst.products.lamp.display_name + " view.";
                    noDataMessage += " Please switch to " + ChartConst.products.mav.display_name + " view";
                }
                break;
            case ChartConst.products.mav.name:
                if (fullData.lamp.forecast) {
                    noDataMessage += " for " + ChartConst.products.mav.display_name + " view.";
                    noDataMessage += " Please switch to " + ChartConst.products.twelvehours.display_name + " or " + ChartConst.products.lamp.display_name + " view";
                }
                break;
            }
            noDataMessage += ".";
        } else {
            noDataMessage = ChartConst.noDataFoundAirportMessage;
        }
        return noDataMessage;
    };
    content.cleanMeteogramChart = function () {
        spinnerService.showSpinner(true);
        d3.selectAll("#meteogramChartContainer svg").remove();
        d3.selectAll("#meteogramChartContainer #aloft-canvas-container-meteo").remove();
    };
    content.showHideNoData = function (show) {
        if (show) {
            d3.select("#meteoNoDataMessage").style("display", "block");
            d3.select("#meteoNoDataMessage span").html(content.noDataFoundText);
        } else {
            d3.select("#meteoNoDataMessage").style("display", "none");
        }
    };
    content.showNoDataStrip = function (fullData, settings) {
        content.noDataFoundText = content.getNoDataMessage(fullData, settings);
        content.showHideNoData(true);
        content.cleanMeteogramChart();
    };
    content.init = function (sourceData, fullData, aloftData, noDataForAloftAvailable) {
        var margin;
        var topSpace;
        var width;
        var chartHeight;
        var svg;
        var svgHeight;
        var svgWidth;
        var bncharts;
        var ceilingChart;
        var precepitationChartY;
        var precepitationChart;
        var windChart;
        var windChartY;
        var tempChart;
        var ceilingChartAxis;
        var precepitationChartAxis;
        var windChartAxis;
        var tempChartAxis;
        var ceilingChartData;
        var precepitationChartData;
        var windChartData;
        var tempChartData;
        var tempMinMaxPlottingData;
        var ceilingChartHeight;
        var dateFormat;
        var dateFormat2;
        var normalTextHeight;
        var allCharts;
        var flightDots;
        var ceilingChartY;
        var tempChartY;
        var rulesetStripHeight;
        var flightRuleStripY;
        var flightRuleStrip;
        var flightWeatherStrip;
        var flightWeatherStripY;
        var flightWeatherStripHeight;
        var xAxisTopContainerHeight;
        var majorContainer;
        var majorContainerHeight;
        var footerHeight;
        var xAxisTopContainer;
        var xAxisTopContainerY;
        var xAxisBottomContainer;
        var xAxisBottomContainerY;
        var xAxisBottomContainerHeight;
        var xAxisAndChartDistance = ChartConst.xAxisAndChartDistance;
        var defaultWindSpeed;
        var totalSizeAvailable;
        var bnxtickRefMeteo;
        var yAxisRightRectWidth;
        var yAxisRectWidth;
        var yAxisRectHeight;
        var yAxisRectY;
        var xAxisMargin;
        var temperatureStripHeight;
        var meteoTemperatureStrip;
        var aloftWindProcessedData;
        var iconMultiplier;
        var ceilingMaxValueAllowed;
        var ceilingMinValueAllowed;
        var linearScaleTicks;
        var hideBottomAxis = utilityService.hideBottomAxis();
        var showAbbreviatedYTicks = utilityService.showAbbreviatedYTicks();
        try {
            topSpace = utilityService.is_small_device()
                ? ChartConst.GraphConfig.mobileTopSpace
                : ChartConst.GraphConfig.topSpace;
            if (!sourceData || !content.settings) {
                return;
            }
            if (!content.settings.airportDetails) {
                content.settings.airportDetails = utilityService.getMatchedAirportObject(content.settings.start);
            }
            if (content.settings.timeZone === AppConst.timeZones.local.key) {
                dateFormat = d3.timeFormat(ChartConst.GraphConfig.xAxis.format + ChartConst.GraphConfig.xAxis.timePostFix.local);
                dateFormat2 = d3.timeFormat(ChartConst.GraphConfig.xAxis2.format);
                sourceData.forecast = bnChartDataProcessService.parseDatesInMode(sourceData.forecast, ChartConst.dateMode.local);
            } else {
                dateFormat = d3.utcFormat(ChartConst.GraphConfig.xAxis.format + ChartConst.GraphConfig.xAxis.timePostFix.zulu);
                dateFormat2 = d3.utcFormat(ChartConst.GraphConfig.xAxis2.format);
                //here also using forecast_ts_local because using d3.utcFormat that will convert local to utc itself
                sourceData.forecast = bnChartDataProcessService.parseDatesInMode(sourceData.forecast, ChartConst.dateMode.local);
            }
            if (utilityService.is_iphone()) {
                defaultWindSpeed = ChartConst.windSpeed.mobileLight;
            } else if (utilityService.is_ipad()) {
                defaultWindSpeed = ChartConst.windSpeed.tabletLight;
            } else {
                defaultWindSpeed = ChartConst.windSpeed.light;
            }

            // function getCeilingMaxDomain(maximumAltitudeAllowed) {
            //     var maxValue;
            //     var nearestThousandBase = Math.round(maximumAltitudeAllowed / 1000) * 1000 || 1000;
            //     if (nearestThousandBase > maximumAltitudeAllowed) {
            //         maxValue = nearestThousandBase;
            //     } else {
            //         maxValue = nearestThousandBase + 1000;
            //     }
            //     return maxValue;
            // }
            ceilingMaxValueAllowed = content.settings.maximumAltitudeAllowed;
            ceilingMinValueAllowed = utilityService.getCeilingMinDomain(content.settings.airportDetails.el, AppConst.dataMode.meteogram);

            linearScaleTicks = utilityService.getLinearTicks(ceilingMinValueAllowed, ceilingMaxValueAllowed, content.settings);
            sourceData.forecast.forEach(function (item) {
                if (content.settings.temperatureUnit === AppConst.temperatureUnits.fahrenheit.key) {
                    item.tmp_display_value = item.tmp_fahrenheit;
                } else {
                    item.tmp_display_value = item.tmp_celsius;
                }
            });

            flightDots = utilityService.is_iphone()
                ? ChartConst.flightDotsMobile
                : ChartConst.flightDots;

            margin = utilityService.is_iphone()
                ? ChartConst.GraphConfig.marginMobile
                : ChartConst.GraphConfig.margin;
            margin = utilityService.is_ipad()
                ? ChartConst.GraphConfig.marginIPad
                : margin;

            footerHeight = utilityService.getFooterHeight() + utilityService.iPhoneXFooterExtraOffset();
            svgWidth = window.innerWidth - (utilityService.is_small_device()
                ? 0
                : parseFloat(AppConst.sideMenuWidth));
            svgHeight = window.innerHeight - utilityService.getHeaderHeight() - footerHeight;
            width = svgWidth - margin.left - margin.right;
            majorContainerHeight = svgHeight;

            //Creating SVG Container Element
            svg = d3.select("#meteogramChartContainer").append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 " + (svgWidth) + " " + (svgHeight)) //class to make it responsive
                .classed("svg-content-responsive", true);
            d3.select("#meteogramChartContainer").append("div")
                .attr("id", "aloft-canvas-container-meteo");
            var trendSvg = d3.select("#meteogramChartContainer").append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 " + (svgWidth) + " " + (svgHeight)) //class to make it responsive
                .classed("svg-content-responsive", true);
            d3.select("#meteogramChartContainer").style("height", (svgHeight - ChartConst.jsScrollSvgFactor) + "px");
            bncharts = svg.append("g").classed("bnchartsmeteo", true);
            bncharts.append("text").text("Bn Chart Reference").attr("id", "bntextrefmeteo").attr("class", "ref-text");
            bncharts.append("text").text("77% RLH").attr("id", "bn-overlap-textref").attr("class", "ref-text");
            bncharts.append("text").text("24Z").attr("id", "bnZuluTextRefMeteo").attr("class", "ref-text");
            bncharts.append("text").text("KMGW").attr("id", "bnAirportTextRefMeteo").attr("class", "ref-text");
            bncharts.append("text").text(function () {
                if (content.settings.maximumAltitudeAllowed <= 12000) {
                    return "100%";
                } else {
                    return "FL200";
                }
            }).attr("id", "bnxtickRefMeteo").attr("class", "ref-text");

            bnxtickRefMeteo = bnd3Service.getSelectionWidth(d3.select("#bnxtickRefMeteo"));
            yAxisRectWidth = bnxtickRefMeteo + (defaultWindSpeed.arrowWidth / 2) + ChartConst.yLeftOffsetToHandleTooltip;

            // yAxisRightRectWidth = utilityService.is_iphone()
            //     ? ChartConst.yAxisRightMeteoWidthMobile
            //     : defaultWindSpeed.arrowWidth;
            yAxisRightRectWidth = Math.max(defaultWindSpeed.arrowWidth, bnd3Service.getSelectionWidth(d3.select("#bnZuluTextRefMeteo")) / 2);
            normalTextHeight = bnd3Service.getSelectionHeight(d3.select("#bntextrefmeteo"));
            if (content.settings.product === ChartConst.products.twelvehours.name && utilityService.is_small_device()) {
                iconMultiplier = ChartConst.iconMultiplier.big;
            } else {
                iconMultiplier = ChartConst.iconMultiplier.default;
            }
            flightWeatherStripHeight = ((flightDots.radius * iconMultiplier) + (flightDots.strokeWidth * 2) + 2);
            rulesetStripHeight = ((flightDots.radius * 2) + (flightDots.strokeWidth * 2) + 2);
            temperatureStripHeight = (normalTextHeight * (hideBottomAxis
                ? 0
                : 2)) + (hideBottomAxis
                ? 0
                : xAxisAndChartDistance);
            xAxisTopContainerHeight = (normalTextHeight * 2) + xAxisAndChartDistance;
            xAxisBottomContainerHeight = hideBottomAxis
                ? 0
                : (normalTextHeight * 2) + xAxisAndChartDistance;
            xAxisTopContainerY = normalTextHeight;
            yAxisRectHeight = majorContainerHeight - xAxisTopContainerHeight - xAxisBottomContainerHeight - flightWeatherStripHeight - (hideBottomAxis
                ? (temperatureStripHeight + topSpace + topSpace / 2)
                : 0);
            yAxisRectY = xAxisTopContainerHeight + flightWeatherStripHeight;
            majorContainer = bncharts.append("g").attr("id", "main-container-meteo");
            majorContainer.append("rect")
                .attr("class", "major-box")
                .attr("x", margin.left)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", majorContainerHeight);

            majorContainer.append("rect")
                .attr("class", "y-axis-background")
                .attr("x", 0)
                .attr("y", yAxisRectY)
                .attr("width", yAxisRectWidth)
                .attr("height", yAxisRectHeight);

            majorContainer.append("rect")
                .attr("class", "y-axis-background")
                .attr("x", width - yAxisRightRectWidth)
                .attr("y", yAxisRectY)
                .attr("width", yAxisRightRectWidth)
                .attr("height", yAxisRectHeight);



            totalSizeAvailable = majorContainerHeight - (xAxisTopContainerHeight + (topSpace * 3) + (topSpace / 2) + xAxisBottomContainerHeight + rulesetStripHeight + flightWeatherStripHeight + (hideBottomAxis
                ? (temperatureStripHeight)
                : 0));

            chartHeight = ((totalSizeAvailable * (100 - (hideBottomAxis
                ? ChartConst.meteoCeilingChartPercentLandscape
                : ChartConst.meteoCeilingChartPercent))) / 100) / (hideBottomAxis
                ? 1
                : 3);
            ceilingChartHeight = ((totalSizeAvailable * (hideBottomAxis
                ? ChartConst.meteoCeilingChartPercentLandscape
                : ChartConst.meteoCeilingChartPercent)) / 100);

            xAxisTopContainer = bncharts.append("g")
                .attr("id", "x-axis-strip-top-meteo")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = xAxisTopContainerY;
                    return "translate(" + x + "," + y + ")";
                });
            xAxisBottomContainerY = majorContainerHeight - ((normalTextHeight) + xAxisAndChartDistance);
            xAxisBottomContainer = bncharts.append("g")
                .attr("id", "x-axis-strip-bottom-meteo")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = xAxisBottomContainerY;
                    return "translate(" + x + "," + y + ")";
                });

            ceilingChartY = xAxisTopContainerHeight + flightWeatherStripHeight + rulesetStripHeight;
            ceilingChart = bncharts.append("g")
                .attr("id", "ceilingChartMeteo")
                .attr("use-big-height", "true")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = ceilingChartY;
                    return "translate(" + x + "," + y + ")";
                });

            flightWeatherStripY = flightWeatherStripHeight + xAxisTopContainerHeight;
            flightWeatherStrip = bncharts.append("g")
                .attr("id", "flightweather-strip-meteo")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = flightWeatherStripY;
                    return "translate(" + x + "," + y + ")";
                });
            flightRuleStripY = rulesetStripHeight + flightWeatherStripHeight + xAxisTopContainerHeight;
            flightRuleStrip = bncharts.append("g").attr("id", "flightrules-strip-meteo")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = flightRuleStripY;
                    return "translate(" + x + "," + y + ")";
                });

            precepitationChartY = ceilingChartY + ceilingChartHeight + topSpace;
            precepitationChart = bncharts.append("g")
                .attr("id", "precepitationChartMeteo")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = precepitationChartY;
                    return "translate(" + x + "," + y + ")";
                });
            var routeWindStrip = bncharts.append("g")
                .attr("id", "route-wind-strip")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = precepitationChartY - (topSpace);
                    return "translate(" + x + "," + y + ")";
                });
            windChartY = precepitationChartY + chartHeight + topSpace;
            windChart = bncharts.append("g")
                .attr("id", "windChartMeteo")
                .attr("chartYValue", windChartY)
                .attr("transform", function () {
                    var x = margin.left;
                    var y = windChartY;
                    return "translate(" + x + "," + y + ")";
                });

            tempChartY = (hideBottomAxis
                ? precepitationChartY
                : windChartY) + chartHeight + topSpace;
            tempChart = bncharts.append("g")
                .attr("id", "tempChartMeteo")
                .attr("chartYValue", tempChartY)
                .attr("transform", function () {
                    var x = margin.left;
                    var y = tempChartY;
                    return "translate(" + x + "," + y + ")";
                });

            var tempStripY = precepitationChartY + chartHeight + (topSpace / 2) + (normalTextHeight); // (majorContainerHeight - ((normalTextHeight * 4) + (xAxisAndChartDistance * 2) + (topSpace / 2)));// (majorContainerHeight - ((normalTextHeight * 4) + (xAxisAndChartDistance * 2) + (topSpace / 2)));
            meteoTemperatureStrip = bncharts.append("g")
                .attr("id", "meteo-temperature-strip")
                .attr("transform", function () {
                    var x = margin.left;
                    var y = tempStripY + 1;
                    return "translate(" + x + "," + y + ")";
                });

            //Creating marker for barb head
            bnd3Service.addBarbMarker(bncharts, "meteo-barbheadLight", defaultWindSpeed);

            xAxisMargin = yAxisRectWidth - 4;
            //Defining chart axis
            ceilingChartAxis = bnChartDataProcessService.getAxis(width, ceilingChartHeight, xAxisMargin, content.settings.timeZone, content.settings.useLogarithmicScaleForCeiling, yAxisRightRectWidth);
            precepitationChartAxis = bnChartDataProcessService.getAxis(width, chartHeight, xAxisMargin, content.settings.timeZone, null, yAxisRightRectWidth);
            windChartAxis = bnChartDataProcessService.getAxis(width, chartHeight, xAxisMargin, content.settings.timeZone, null, yAxisRightRectWidth);
            tempChartAxis = bnChartDataProcessService.getAxis(width, chartHeight, xAxisMargin, content.settings.timeZone, null, yAxisRightRectWidth);


            ceilingChartData = bnChartDataProcessService.getCigVisChartData(sourceData.forecast, DefConst.xAxisKey.forecastTs, content.settings, true);

            precepitationChartData = bnChartDataProcessService.getP06Q06t06st6ChartData(sourceData.forecast, DefConst.xAxisKey.forecastTs, content.settings);
            tempMinMaxPlottingData = bnChartDataProcessService.getHighLowOfTemp(sourceData.forecast, content.settings);
            tempChartData = bnChartDataProcessService.getTmpRlhChartData(sourceData.forecast, DefConst.xAxisKey.forecastTs, content.settings);
            //Processing aloft data
            if (aloftData && ceilingChartData[0]) {
                aloftData = bnChartDataService.getViewRelatedAloftData(aloftData, ceilingChartData[0], content.settings, sourceData);
                aloftData.freezingLineData = bnChartDataProcessService.filterAloftToGetFreezingLineRecord(ceilingChartData[0], aloftData);
                aloftWindProcessedData = bnChartDataProcessService.filterAloftToGetGustLineRecord(ceilingChartData[0], aloftData, fullData);
                aloftData.gustLineData = aloftWindProcessedData.gustLineData;
                aloftData.exactMatchData = aloftWindProcessedData.exactMatchData;
                if (content.settings.product === ChartConst.products.mav.name) {
                    aloftData.gustLineData.forEach(function (item, key) {
                        if (sourceData.forecast[key] && content.settings.product === "MAV" && !sourceData.forecast[key].isUsingLamp) {
                            if (item.y < ChartConst.ChartLabelSpecs.wgs.minimumWgsForMavToShow || sourceData.forecast[key].wsp < ChartConst.ChartLabelSpecs.wgs.minimumWspForMavToShowWgs) {
                                sourceData.forecast[key].wgs = null;
                            } else {
                                sourceData.forecast[key].wgs = item.y;
                            }
                        } else if (sourceData.forecast[key]) {
                            if ((item.y < ChartConst.ChartLabelSpecs.wgs.minValueRequiredToShow) || (item.y - sourceData.forecast[key].wsp) < ChartConst.ChartLabelSpecs.wgs.minDiffReqFromWsp) {
                                sourceData.forecast[key].wgs = null;
                            } else {
                                sourceData.forecast[key].wgs = item.y;
                            }
                        }
                        bnChartDataProcessService.appendWeatherStripData(sourceData.forecast[key], "forecast_ts_local");
                    });
                }
            }
            windChartData = bnChartDataProcessService.getWdrWspXwdChartData(sourceData.forecast, DefConst.xAxisKey.forecastTs, content.settings);

            if (ceilingChartData.length || precepitationChartData.length || tempMinMaxPlottingData.length || tempChartData.length || windChartData.length) {
                //Draw x-axis top
                xAxisMeteogramService.drawXaxis(sourceData,
                        flightRuleStrip,
                        flightWeatherStrip,
                        flightWeatherStripHeight,
                        temperatureStripHeight,
                        hideBottomAxis,
                        xAxisTopContainer,
                        width,
                        topSpace,
                        ceilingChartAxis.x,
                        yAxisRectWidth,
                        yAxisRightRectWidth,
                        ceilingChartHeight,
                        ceilingChartY,
                        dateFormat,
                        dateFormat2,
                        content.settings,
                        flightDots,
                        majorContainerHeight,
                        xAxisTopContainerHeight,
                        xAxisBottomContainerHeight,
                        true);
                if (!hideBottomAxis) {
                    //Draw x-axis bottom
                    xAxisMeteogramService.drawXaxis(sourceData,
                            flightRuleStrip,
                            flightWeatherStrip,
                            flightWeatherStripHeight,
                            temperatureStripHeight,
                            hideBottomAxis,
                            xAxisBottomContainer,
                            width,
                            topSpace,
                            ceilingChartAxis.x,
                            yAxisRectWidth,
                            yAxisRightRectWidth,
                            ceilingChartHeight,
                            ceilingChartY,
                            dateFormat,
                            dateFormat2,
                            content.settings,
                            flightDots,
                            majorContainerHeight,
                            xAxisTopContainerHeight,
                            xAxisBottomContainerHeight,
                            false);
                }
                ceilingChartData = ceilingChartService.drawChart(sourceData,
                        content.settings,
                        ceilingChartData,
                        ceilingChart,
                        ceilingChartHeight,
                        width,
                        topSpace,
                        ceilingMaxValueAllowed,
                        ceilingMinValueAllowed,
                        linearScaleTicks,
                        ceilingChartAxis.x,
                        ceilingChartAxis.y1,
                        yAxisRectWidth,
                        yAxisRightRectWidth,
                        aloftData,
                        fullData);
                precepitationChartData = precepitationChartService.drawChart(sourceData,
                        precepitationChartData,
                        precepitationChart,
                        chartHeight,
                        width,
                        topSpace,
                        precepitationChartAxis.x,
                        precepitationChartAxis.y1,
                        precepitationChartAxis.y2);


                if (!hideBottomAxis) {
                    windChartData = windChartService.drawChart(sourceData,
                            content.settings,
                            windChartData,
                            windChart,
                            chartHeight,
                            width,
                            topSpace,
                            windChartAxis.x,
                            windChartAxis.y1,
                            showAbbreviatedYTicks);

                    bnd3Service.addChartLabels(windChart, normalTextHeight, width, ChartConst.chartLabels.winds);
                    tempChartData = tempChartService.drawChart(sourceData,
                            content.settings,
                            tempChartData,
                            tempChart,
                            chartHeight,
                            width,
                            topSpace,
                            tempChartAxis.x,
                            tempChartAxis.y1,
                            tempChartAxis.y2,
                            tempMinMaxPlottingData,
                            yAxisRectWidth,
                            yAxisRightRectWidth,
                            hideBottomAxis);
                    bnd3Service.addChartLabels(tempChart, normalTextHeight, width, ChartConst.chartLabels.temps);
                } else {
                    // windStripService.drawWindStrip(sourceData.forecast,
                    //         windChartData,
                    //         routeWindStrip,
                    //         windChartAxis.x,
                    //         DefConst.xAxisKey.forecastTs);
                    // temperatureStripService.drawTemperatureStrip(sourceData.forecast,
                    //         meteoTemperatureStrip,
                    //         width,
                    //         topSpace,
                    //         tempChartAxis.x,
                    //         xAxisAndChartDistance,
                    //         content.settings.temperatureUnit,
                    //         normalTextHeight,
                    //         DefConst.xAxisKey.forecastTs);
                    //Adding wind-records for tooltip
                    if (windChartData && windChartData[1]) {
                        windChartData[1].group = 1;
                        ceilingChartData.push(windChartData[1]);
                        if (content.settings.product === ChartConst.products.lamp.name) {
                            windChartData[2].group = 1;
                            ceilingChartData.push(windChartData[2]);
                        }
                    }
                }
                //Adding Chart Label
                bnd3Service.addChartLabels(ceilingChart, normalTextHeight, width, ChartConst.chartLabels.ceiling);
                bnd3Service.addChartLabels(precepitationChart, normalTextHeight, width, ChartConst.chartLabels.precepitation);
                if (noDataForAloftAvailable === true) {
                    bnd3Service.addNoSeriesDataText(ceilingChart, ceilingChartData, ceilingChartHeight, width - yAxisRectWidth - yAxisRightRectWidth, yAxisRectWidth, ChartConst.chartLabels.ceiling.noAloftData, noDataForAloftAvailable);
                }
                bnd3Service.addNoSeriesDataText(precepitationChart, precepitationChartData, chartHeight, width - yAxisRectWidth - yAxisRightRectWidth, yAxisRectWidth, ChartConst.chartLabels.precepitation.noSeriesLabel);
                bnd3Service.addNoSeriesDataText(windChart, windChartData, chartHeight, width - yAxisRectWidth - yAxisRightRectWidth, yAxisRectWidth, ChartConst.chartLabels.winds.noSeriesLabel);
                bnd3Service.addNoSeriesDataText(tempChart, tempChartData, chartHeight, width - yAxisRectWidth - yAxisRightRectWidth, yAxisRectWidth, ChartConst.chartLabels.temps.noSeriesLabel);

                allCharts = {
                    ceilingChart: {
                        data: ceilingChartData,
                        axisInfo: ceilingChartAxis
                    },
                    precepitationChart: {
                        data: precepitationChartData,
                        axisInfo: precepitationChartAxis
                    },
                    windChart: {
                        data: windChartData,
                        axisInfo: windChartAxis
                    },
                    tempChart: {
                        data: tempChartData,
                        axisInfo: tempChartAxis
                    }
                };
                // console.log(allCharts);
                trackLineService.drawTrackLine(majorContainerHeight,
                        xAxisTopContainerHeight,
                        xAxisBottomContainerHeight,
                        hideBottomAxis,
                        temperatureStripHeight,
                        content.settings,
                        chartHeight,
                        ceilingChartHeight,
                        width,
                        allCharts,
                        dateFormat,
                        sourceData,
                        topSpace,
                        margin,
                        ceilingChartY,
                        rulesetStripHeight,
                        flightWeatherStripHeight,
                        yAxisRectHeight,
                        yAxisRectWidth,
                        yAxisRightRectWidth,
                        aloftData,
                        ceilingChartAxis,
                        trendSvg,
                        ceilingMaxValueAllowed,
                        ceilingMinValueAllowed);

                bnd3Service.processChartComponents(bncharts, chartHeight, margin, svgHeight, width, yAxisRectWidth, ceilingChartHeight, yAxisRightRectWidth);

                bnd3Service.shiftLines(ceilingChart, ChartConst.areaLineShift.invert);
                bnd3Service.shiftLines(precepitationChart, ChartConst.areaLineShift.normal);
                bnd3Service.shiftLines(windChart, ChartConst.areaLineShift.normal);
                bnd3Service.shiftLines(tempChart, ChartConst.areaLineShift.normal);
            } else {
                content.showNoDataStrip(fullData, content.settings);
            }
        } catch (e) {
            console.log(e);
        }
        spinnerService.showSpinner(false);
    };
    content.processData = function (data, fullData, aloftData, noDataForAloftAvailable) {
        //If there are forecast records
        if (data && data.forecast && data.forecast.length) {
            content.showHideNoData(false);
            content.chartData = data;
            content.completeData = fullData;
            content.chartAloftData = aloftData;
            content.chartNoDataForAloftAvailable = noDataForAloftAvailable;
            content.init(underscore.clone(content.chartData, true), fullData, aloftData, noDataForAloftAvailable);
        } else {
            content.showNoDataStrip(fullData, content.settings);
            spinnerService.showSpinner(false);
        }
    };
    content.startRendering = function (data, fullData, aloftData, noDataForAloftAvailable) {
        if (data) {
            content.cleanMeteogramChart();
            content.processData(data, fullData, aloftData, noDataForAloftAvailable);
        }
    };
    content.chartApi.showInValidAirport = function () {
        content.showNoDataStrip();
        spinnerService.showSpinner(false);
    };
    //Call this function too redraw the chart
    content.chartApi.refresh = function (data, fullData, aloftData, noDataForAloftAvailable, settings, showNoData) {
        content.settings = settings;
        content.startRendering(data, fullData, aloftData, noDataForAloftAvailable, showNoData);
    };

    //Call this function too redraw the chart
    content.chartApi.cleanChart = function () {
        // settings = scope.settings;
        content.cleanMeteogramChart();
    };
    return content;
};
export default meteogramChartService();
