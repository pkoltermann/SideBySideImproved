(function($) {
var testChart = {
    init: function (params) {
        var defaultParams = {
            pointsCount: 10,
            streams: [],
            placeSelector: ".placeholder",
            yaxes: [ { min: 0 },
                {
                    // align if we are to the right
                    alignTicksWithAxis: 1,
                    position: "right"
     //               tickFormatter: function (v) { return '$' + v.toFixed(2); }
                } 
            ],
            legend: {
                show: true,
                labelFormatter: null,
                labelBoxBorderColor: 'black',
                noColumns: 2,
                position: "sw",
                margin: 0,
                backgroundColor: null,
                backgroundOpacity: 0,
                container: $(params.container + ' .legend'),
                sorted: null
            },
            grid: {
                show: true,
                aboveData: true,
                //   color: color
                //    backgroundColor: color/gradient or null
                //     margin: number or margin object
                //     labelMargin: number
                //     axisMargin: number
                //     markings: array of markings or (fn: axes -> array of markings)
                //      borderWidth: number or object with "top", "right", "bottom" and "left" properties with different widths
                //     borderColor: color or null or object with "top", "right", "bottom" and "left" properties with different colors
                //      minBorderMargin: number or null
                clickable: true,
                hoverable: true,
                autoHighlight: true
                //    mouseActiveRadius: number
            },
            streamTemplate: { 
                data: [], 
                label: 'label',
                hoverable: true,
                color: '#BB9E2B',
                highlightColor: 'yellow',
                lines: { 
                    show: false, 
                    fill: true, 
                    steps: false 
                },
                bars: { 
                    show: true, 
                    barWidth: 0.5,
                    order: 1
                }
            }
        };
        this.params = (params) ? $.extend(true, {}, defaultParams, params) : defaultParams;
        this.points = this.getPoints();
    },
    plot: function (params) {
        this.init(params);
        $.plot($(this.params.container).find(this.params.placeSelector),
        this.getYaxis(),
        { 
 //           xaxes: this.xaxes,
            yaxes: this.params.yaxes,
            legend: this.params.legend,
             grid: this.params.grid
        });
    },
    getPoints: function () {
        var points = [];
        for (var i=0; i < this.params.pointsCount; i++) {
            points.push(i);
        }
        return points;
    },
    generateData: function () {
        var result = [];
        for(var streamId in this.params.streams) {
            result[streamId] = [];
            for (var point in this.points)
             {
                result[streamId].push([parseInt(point, 10), parseInt(point, 10) + parseInt(streamId, 10)]);
            }
        }
        return result;
    },
    getYaxis: function() {
        var data = this.generateData();
        var result = [];
        for (var id in this.params.streams) {
            var stream = this.params.streams[id];
            result.push($.extend(true, {}, this.params.streamTemplate, stream, {data: data[id]}));
        }
        return result;
    }
};

var barsParams = {
    container: "#chart1",
    streams: [
        {
            label: 's1',
            color: 'red',
            bars: {
                order: 1
            }
        },  
        {
            label: 's3',
            color: 'green',
            bars: {
                order: 2
            }
        }
    ]
};
var stackedBarsParams = {
    container: "#chart2",
    streams: [
        {
            label: 's1',
            stack: 1,
            color: 'red',
            bars: {
                order: 1
            }
        }, 
        {
            label: 's2',
            stack: 1,
            color: 'yellow',
            bars: {
                order: 1
            }
        }, 
        {
            label: 's3',
            stack: 2,
            color: 'green',
            bars: {
                order: 2
            }
        }, 
        {
            label: 's4',
            stack: 2,
            color: 'brown',
            bars: {
                order: 2
            }
        }
    ]
};
var stackedParams = {
    container: "#chart3",
    streams: [
        {
            label: 's1',
            stack: 1,
            color: 'red',
            bars: null
        }, 
        {
            label: 's2',
            stack: 1,
            color: 'yellow',
            bars: null
        }
    ]
};
  
    $(function() {
        testChart.plot(barsParams);
        testChart.plot(stackedBarsParams);
        //testChart.plot(stackedParams);
    });
})(jQuery);