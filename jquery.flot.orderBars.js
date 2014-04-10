/*
 * Flot plugin to order bars side by side. This is improved version of Benjamin BUFFET work
 * originally from http://en.benjaminbuffet.com/labs/flot/.
 * 
 * Released under the MIT license by Przemyslaw Koltermann, 12-Feb-2013.
 *
 * This plugin is an alpha version.
 *
 * To activate the plugin you must specify the parameter "order" for the specific serie :
 *
 *  $.plot($("#placeholder"), [{ data: [ ... ], bars :{ order = null or integer }])
 *
 * If 2 series have the same order param, they are displayed in the same position;
 *
 * The plugin adjust the point by adding a value depanding of the barwidth
 * Exemple for 3 series (barwidth : 0.1) :
 *
 *          first bar décalage : -0.15
 *          second bar décalage : -0.05
 *          third bar décalage : 0.05
 *
 */

(function($){
    function init(plot){
        var orderedBarSeries;
        var nbOfBarsToOrder;
        var seriesPos = [];
        var sameOrderSeries = [];
        var isHorizontal = false;

        /*
         * This method add shift to x values
         */
        function reOrderBars(plot, serie, datapoints){
            var shiftedPoints = null;
            
            if (plot.sideBySideSameOrderSeriess) {
                sameOrderSeries = plot.sideBySideSameOrderSeries;
            } else {
                plot.sideBySideSameOrderSeries = sameOrderSeries;
            }
            
            if(serieNeedToBeReordered(serie)){     
                isHorizontal = isGraphHorizontal(serie);
                retrieveBarSeries(plot);
                
                var centerBarNr = getCenterBarNr(nbOfBarsToOrder);
                var centerBarShift = calculCenterBarShift(centerBarNr);
                
                if(nbOfBarsToOrder >= 2){  
                    var position = findPosition(serie);
                    var decallage = 0;

                    if (isBarAtLeftOfCenter(position)){
                        var barEnd = (centerBarNr) ? centerBarNr : nbOfBarsToOrder/2;
                        decallage = -1 * (sumWidth(orderedBarSeries, position, barEnd)) - centerBarShift;
                    } else if (isBarAtRightOfCenter(position)) {
                        var barStart = (centerBarNr) ? centerBarNr + 2 : nbOfBarsToOrder/2 + 1;
                        var barEnd = position - 1;
                        decallage = sumWidth(orderedBarSeries, barStart, barEnd) + centerBarShift;
                    } else {
                        decallage = - centerBarShift;
                    }

                    shiftPoints(datapoints,serie,decallage);
               } else if (nbOfBarsToOrder === 1){
                   // To be consistent with the barshift at other uneven numbers of bars, where
                   // the center bar is centered around the point, we also need to shift a single bar
                   // left by half its width
                   var centerBarShift = -1 * calculCenterBarShift();
                   shiftPoints(datapoints,serie,centerBarShift);
               }
           }
           return shiftedPoints;
        }

        function serieNeedToBeReordered(serie){
            return serie.bars
                && serie.bars.show
                && serie.bars.order;
        }

        function calculPixel2XWidthConvert(plot){
            var gridDimSize = isHorizontal ? plot.getPlaceholder().innerHeight() : plot.getPlaceholder().innerWidth();
            var minMaxValues = isHorizontal ? getAxeMinMaxValues(plot.getData(),1) : getAxeMinMaxValues(plot.getData(),0);
            var AxeSize = minMaxValues[1] - minMaxValues[0];
            return AxeSize / gridDimSize;
        }

        function getAxeMinMaxValues(series,AxeIdx){
            var minMaxValues = new Array();
            for(var i = 0; i < series.length; i++){
                minMaxValues[0] = series[i].data[0][AxeIdx];
                minMaxValues[1] = series[i].data[series[i].data.length - 1][AxeIdx];
            }
            if(typeof minMaxValues[0] === 'string'){
                minMaxValues[0] = 0;
                minMaxValues[1] = series[0].data.length - 1;
            }
            return minMaxValues;
        }

        function retrieveBarSeries(plot){
            orderedBarSeries = findOtherBarsToReOrders(plot.getData());
            nbOfBarsToOrder = orderedBarSeries.length;
        }

        function findOtherBarsToReOrders(series){
            var retSeries = new Array();

            for(var i = 0; i < series.length; i++){
                if(series[i].bars.order && series[i].bars.show){
                    retSeries.push(series[i]);
                }
            }

            return sortByOrder(retSeries);
        }
        
        function getCenterBarNr(nbOfBarsToOrder) {
            if (nbOfBarsToOrder % 2 === 0) {
                return false;
            }
            
            return Math.floor(nbOfBarsToOrder/2);
        }

        function sortByOrder(series) {
            var n = series.length;
            for (var i = 0; i < n; i += 1) {
                var ssIndex = series[i].bars.order;
                if (!sameOrderSeries[ssIndex]) {
                    sameOrderSeries[ssIndex] = [];
                }
                series[i].ssIndex = ssIndex;
                sameOrderSeries[ssIndex].push(series[i]);
            }
            var newSeries = [];
            var newSOSeries = [];
            
            for(var sid in sameOrderSeries) {
                var sos = sameOrderSeries[sid];
                sos.sort(sortByWidth);
                newSOSeries.push(sos);
                newSeries.push(sos[0]);
            }
            

            for (var i = 0; i < newSeries.length; i++) {
                if (newSeries[i].ssIndex) {
                    seriesPos[newSeries[i].ssIndex] = i;
                }
            }
            return newSeries;
        }
        
        function sortByWidth(serie1,serie2){
            var x = serie1.bars.barWidth ? serie1.bars.barWidth : 1;
            var y = serie2.bars.barWidth ? serie2.bars.barWidth : 1;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
        function removeElement(arr, index) {
            return arr.splice(index, 1);
        }
                
        function isGraphHorizontal(serie){
            if(serie.bars.horizontal){
                return true;
            }
            return false;
        }

        function findPosition(serie){
            var ss = sameOrderSeries;
            var pos = 0;
            if (serie.ssIndex) {
                pos = seriesPos[serie.ssIndex];
            }
            else {
                for (var i = 0; i < orderedBarSeries.length; ++i) {
                    if (serie === orderedBarSeries[i]){
                        pos = i;
                        break;
                    }
                }
            }
            return pos+1;
        }

        function calculCenterBarShift(centerBarNr){
            if (!centerBarNr) {
                return 0;
            }
                // Since the array indexing starts at 0, we need to use Math.floor instead of
                // Math.ceil otherwise we will get an error if there is only one bar
            return  calculateSerieWidth(orderedBarSeries[centerBarNr])/2;
        }

        function isBarAtLeftOfCenter(position){
            return position <= Math.floor(nbOfBarsToOrder / 2);
        }
        
        function isBarAtRightOfCenter(position){
            return position > Math.ceil(nbOfBarsToOrder / 2);
        }

        function sumWidth(series,start,end){
            var totalWidth = 0;

            for(var i = start; i <= end; i++){
                totalWidth += calculateSerieWidth(series[i]);
            }

            return totalWidth;
        }
        
        function calculateSerieWidth(serie) {
            return serie.bars.barWidth;
        }

        function shiftPoints(datapoints,serie,dx){
            var ps = datapoints.pointsize;
            var points = datapoints.points;
            var j = 0;           
            for(var i = isHorizontal ? 1 : 0; i < points.length; i += ps){
                points[i] += dx;
                //Adding the new x value in the serie to be abble to display the right tooltip value,
                //using the index 3 to not overide the third index.
                serie.data[j][3] = points[i];
                j++;
            }

            return points;
        }

        plot.hooks.processDatapoints.push(reOrderBars);

    }

    var options = {
        series : {
            bars: {order: null} // or number/string
        }
    };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: "orderBars",
        version: "0.2"
    });

})(jQuery);

