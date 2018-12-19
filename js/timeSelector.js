class TimeSelector {

    constructor(directoryChart,vcMap) {
                
        this.dependentCharts = {
            vcMap : vcMap,
            directoryChart : directoryChart
        };

        this.margin = {top: 20, right: 100, bottom: 50, left: 200};
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
        this.width_full = 1200;
        this.height_full = 300;
        this.current = '2013';

        this.lineNameToColor = new Object();

        this.lineColors = ["rgb(0, 0, 0)", "rgb(1, 0, 103)", "rgb(213, 255, 0)", "rgb(255, 0, 86)", "rgb(158, 0, 142)", "rgb(14, 76, 161)", "rgb(255, 229, 2)", "rgb(0, 95, 57)", "rgb(0, 255, 0)", "rgb(149, 0, 58)", "rgb(255, 147, 126)", "rgb(164, 36, 0)", "rgb(0, 21, 68)", "rgb(145, 208, 203)", "rgb(98, 14, 0)", "rgb(107, 104, 130)", "rgb(0, 0, 255)", "rgb(0, 125, 181)", "rgb(106, 130, 108)", "rgb(0, 174, 126)", "rgb(194, 140, 159)", "rgb(190, 153, 112)", "rgb(0, 143, 156)", "rgb(95, 173, 78)", "rgb(255, 0, 0)", "rgb(255, 0, 246)", "rgb(255, 2, 157)", "rgb(104, 61, 59)", "rgb(255, 116, 163)", "rgb(150, 138, 232)", "rgb(152, 255, 82)", "rgb(167, 87, 64)", "rgb(1, 255, 254)", "rgb(255, 238, 232)", "rgb(254, 137, 0)", "rgb(189, 198, 255)", "rgb(1, 208, 255)", "rgb(187, 136, 0)", "rgb(117, 68, 177)", "rgb(165, 255, 210)", "rgb(255, 166, 254)", "rgb(119, 77, 0)", "rgb(122, 71, 130)", "rgb(38, 52, 0)", "rgb(0, 71, 84)", "rgb(67, 0, 44)", "rgb(181, 0, 255)", "rgb(255, 177, 103)", "rgb(255, 219, 102)", "rgb(144, 251, 146)", "rgb(126, 45, 210)", "rgb(189, 211, 147)", "rgb(229, 111, 254)", "rgb(222, 255, 116)", "rgb(0, 255, 120)", "rgb(0, 155, 255)", "rgb(0, 100, 1)", "rgb(0, 118, 255)", "rgb(133, 169, 0)", "rgb(0, 185, 23)", "rgb(120, 130, 49)", "rgb(0, 255, 198)", "rgb(255, 110, 65)", "rgb(232, 94, 190)"]

        var self = this;
        return self;
        
    }


    formatData(data) {
        data = JSON.parse(data);
        let lineNames = Object.keys(data);
        let formattedLines = new Object();
        let nextLine;

        for (let i=0; i < lineNames.length; i++) { 
            // Next line: a list of dicitonaries [{year:----, amount:-----}, {year:----, amount:-----}, {year:----, amount:-----}]
            // console.log("next data");
            nextLine = this.formatLine(data[lineNames[i]]);
            formattedLines[lineNames[i]] = nextLine
        }

        return(formattedLines)

    }

    formatLine(data) {
        var dataLength = data.length;
        let years = [];
        let temp = {};
        let filteredData = [];
        let nextDataPoint = {};
        let startYear = 2000;
        let endYear = 2013;
        let nextYear;
        let nextAmount;

        // Initialize data to years of interest and amounts of 0
        for (var i = startYear; i < endYear+1; i++) {
            nextDataPoint = {}
            nextDataPoint['year'] = i;
            nextDataPoint['amount'] = 0;
            temp[i] = nextDataPoint;
        }

        // update amounts for years between startYear and endYear when data available
        for (var i = 0; i < dataLength; i++) {
            nextDataPoint = {}
            nextYear = data[i]['year'];
            // Only want data in year range of interest
            if ((nextYear > startYear) && (nextYear < endYear+1)) {
                
                let nextAmount = data[i]['amount'];
                // If null amount, default to 0 and continue
                if (nextAmount!="null") {
                    nextAmount = parseInt(data[i]['amount'].replace(/,/g, ''));
                } else {
                    continue;
                }
                nextDataPoint['year'] = nextYear;
                nextDataPoint['amount'] = nextAmount;
                temp[nextYear] = nextDataPoint;
            }
        }

        // Formt
        for (var i = startYear; i < endYear+1; i++) {
            filteredData.push(temp[i]);
        }

        let max = d3.max(filteredData, function(d) { return +d.amount;} );

        let ret = {}
        ret['years'] = years;
        ret['data'] = filteredData;
        ret['max'] = max;
        return ret;
    }


    initiate(data) {
        var self = this;
        let temp = this.formatData(data);
        // console.log("temp: " + Object.keys(temp));
        // console.log("temp data: " + temp['data']);
        // for (let i=0; i <temp['data'].length; i++) {
            // console.log(temp['data'][i]);
        // }

        self.lines = temp;

        // self.years = temp['years'];
        // self.data = temp['data'];
        // self.max = temp['max'];

        // SVG
        self.svg = d3.select("#timeSelector")
                .append("svg")
                .attr("id", "timeSVG")
                .attr("width", self.width + self.margin.left + self.margin.right)
                .attr("height", self.height + self.margin.top + self.margin.bottom)
                .attr("align","center");
    }

    update() {
        var self = this;
        let keys = Object.keys(self.lines);

        let overallMax = 0;
        for(let i=0; i < keys.length; i++) {
            if (overallMax < self.lines[keys[i]]['max']) {
                overallMax = self.lines[keys[i]]['max'];
            }
        }

        // Remove old line
        d3.select("#timeSelector").html("");
        // d3.select("#timeSVG").remove();

        self.svg = d3.select("#timeSelector")
                .append("svg")
                .attr("id", "timeSVG")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 "+this.width_full+" "+this.height_full)
                //.attr("width", self.width + self.margin.left + self.margin.right)
                //.attr("height", self.height + self.margin.top + self.margin.bottom)
                .attr("align","center");
        // Brush
        function brushed() {
            let s = d3.event.selection;
            let min = Math.ceil(xScale.invert(s[0]));
            let max = Math.floor(xScale.invert(s[1]));
            self.refreshMap(min, max);
        }

        let brush = d3.brushX()
            .extent([[0, 0], [self.margin.left + self.width, self.margin.top + self.height]])
            .on("brush end", brushed); 

        let line = d3.line()
            .x(function (d) { 
                return xScale(d.year); })
            .y(function (d) { 
                return yScale(d.amount); });

        // Scales
        let xScale = d3.scaleLinear()
                    .domain([2000, 2013])
                    .range([0, this.width]); 

        let yScale = d3.scaleLinear()
                    .domain([0, overallMax])
                    .range([this.margin.top+this.height, this.margin.top]);


        // Axes
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        let context = self.svg.append("g")
            .attr("id", "context")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        let nextData;
        // Append lines
        for(let i=0; i < keys.length; i++) {
            nextData = self.lines[keys[i]]['data'];

            context.append("path")
                .datum(nextData)
                // .attr("id", "line")
                .attr("d", line)
                .attr("stroke", this.lineColors[i])
                .attr("stroke-width", "2px")
                .attr("fill", "none")
                .style("stroke-linecap", "round")
                .style("stroke-linejoin", "round");
            // UPDATE DICTIONARY WITH LINE NAME -> COLORS
            this.lineNameToColor[keys[i]] = this.lineColors[i]
        }

          context.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + (self.margin.top + self.height) + ")")
              .style("font", "26px Product Sans")
              .call(xAxis
                .tickFormat(d3.format("4")));;

          context.append("g")
                .style("font", "26px Product Sans")
                .call(yAxis
                    .ticks(4));

          context.append("g")
              .attr("class", "brush")
              .call(brush)
              .call(brush.move, xScale.range());
    }

    refreshMap(minYear, maxYear){
        var self = this;
        self.dependentCharts.vcMap.changeYear(minYear, maxYear);
        self.dependentCharts.directoryChart.changeYear(minYear, maxYear);            
    }

}