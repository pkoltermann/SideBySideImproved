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
        var borderWidth;
        var borderWidthInXabsWidth;
        var pixelInXWidthEquivalent = 1;  //X axis unit/pixel
        var isHorizontal = false;

        /*
         * This method add shift to x values
         */
        function reOrderBars(plot, serie, datapoints){
            var shiftedPoints = null;
            
            if (plot.sameOrderSeries) {
                sameOrderSeries = plot.sameOrderSeries;
            } else {
                plot.sameOrderSeries = sameOrderSeries;
            }
            
            if(serieNeedToBeReordered(serie)){     
                isHorizontal = isGraphHorizontal(serie);
                pixelInXWidthEquivalent = calculPixel2XWidthConvert(plot);
                retrieveBarSeries(plot);
                calculBorderAndBarWidth(serie);
                
                if(nbOfBarsToOrder >= 2){  
                    var position = findPosition(serie);
                    var decallage = 0;
                    
                    var centerBarShift = calculCenterBarShift();

                    if (isBarAtLeftOfCenter(position)){
                        decallage = -1*(sumWidth(orderedBarSeries,position-1,Math.floor(nbOfBarsToOrder / 2)-1)) - centerBarShift;
                    }else{
                        decallage = sumWidth(orderedBarSeries,Math.ceil(nbOfBarsToOrder / 2),position-2) + centerBarShift + borderWidthInXabsWidth*2;
                    }

                    shiftedPoints = shiftPoints(datapoints,serie,decallage);
                    datapoints.points = shiftedPoints;
               } else if (nbOfBarsToOrder === 1){
                   // To be consistent with the barshift at other uneven numbers of bars, where
                   // the center bar is centered around the point, we also need to shift a single bar
                   // left by half its width
                   var centerBarShift = -1*calculCenterBarShift();
                   shiftedPoints = shiftPoints(datapoints,serie,centerBarShift);
                   datapoints.points = shiftedPoints;
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

        function sortByOrder(series){
            var n = series.length;
            do {
                for (var i=0,j=1; i < n - 1; i+=1,j=i+1) {
                    if (series[i].bars.order > series[j].bars.order) {
                        var tmp = series[i];
                        series[i] = series[j];
                        series[j] = tmp;
                    }
                    else if (series[i].bars.order === series[j].bars.order) {
                        
                        //check if any of the series has set ssIndex
                        var ssIndex;
                        if (typeof series[i].ssIndex === 'number' && 
                                typeof series[j].ssIndex !== 'number') {
                            ssIndex = series[i].ssIndex;
                            series[j].ssIndex = ssIndex;
                            sameOrderSeries[ssIndex].push(series[j]);                                
                            sameOrderSeries[ssIndex].sort(sortByWidth);
                            removeElement(series, j);
                          
                        }
                        
                        else if (typeof series[j].ssIndex === 'number' && 
                                typeof series[i].ssIndex !== 'number') {
                            ssIndex = series[j].ssIndex;
                            series[i].ssIndex = ssIndex;
                            sameOrderSeries[ssIndex].push(series[i]);                                
                            sameOrderSeries[ssIndex].sort(sortByWidth);
                            removeElement(series, j);
                        }
                        else if (typeof series[i].ssIndex === 'number' && 
                                typeof series[j].ssIndex === 'number') {
                            var ssToMergeId = series[j].ssIndex;
                            var ssToMerge = sameOrderSeries[ssToMergeId];
                            ssIndex = series[i].ssIndex;
                            for (var csid in ssToMerge) {
                                var ssToMove = ssToMerge[csid];
                                ssToMove.ssIndex = ssIndex;
                                sameOrderSeries[ssIndex].push(ssToMove);
                                sameOrderSeries[ssIndex].sort(sortByWidth);
                            }
                            removeElement(sameOrderSeries, ssToMergeId);
                            removeElement(series, j);
                        }
                        
                        else {
                            ssIndex = sameOrderSeries.length;
                            sameOrderSeries[ssIndex] = [];
                            series[i].ssIndex = ssIndex;
                            series[j].ssIndex = ssIndex;
                            sameOrderSeries[ssIndex].push(series[i]);      
                            sameOrderSeries[ssIndex].push(series[j]);  
                            sameOrderSeries[ssIndex].sort(sortByWidth);
                            removeElement(series, j);
                        }
                        i--;
                        n--;

                        
                        //leave the wider serie and the other one move to 
                    }
                }
                n = n-1;
            }
            while (n>1);
            for (var i=0; i < series.length; i++) {
                if (series[i].ssIndex) {
                    seriesPos[series[i].ssIndex] = i;
                }
            }
            return series;
        }
        
        function sortByWidth(serie1,serie2){
            var x = serie1.bars.barWidth ? serie1.bars.barWidth : 1;
            var y = serie2.bars.barWidth ? serie2.bars.barWidth : 1;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
        function removeElement(arr, index) {
            return arr.splice(index, 1);
        }
        
        function  calculBorderAndBarWidth(serie){
            borderWidth = typeof serie.bars.lineWidth === "number" ? serie.bars.lineWidth  : 2;
            borderWidthInXabsWidth = borderWidth * pixelInXWidthEquivalent;
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

        function calculCenterBarShift(){
            var width = 0;

            if(nbOfBarsToOrder%2 !== 0)
                // Since the array indexing starts at 0, we need to use Math.floor instead of
                // Math.ceil otherwise we will get an error if there is only one bar
                width = (orderedBarSeries[Math.floor(nbOfBarsToOrder / 2)].bars.barWidth)/2;

            return width;
        }

        function isBarAtLeftOfCenter(position){
            return position <= Math.ceil(nbOfBarsToOrder / 2);
        }

        function sumWidth(series,start,end){
            var totalWidth = 0;

            for(var i = start; i <= end; i++){
                totalWidth += series[i].bars.barWidth+borderWidthInXabsWidth*2;
            }

            return totalWidth;
        }

        function shiftPoints(datapoints,serie,dx){
            var ps = datapoints.pointsize;
            var points = datapoints.points;
            var j = 0;           
            for(var i = isHorizontal ? 1 : 0;i < points.length; i += ps){
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

