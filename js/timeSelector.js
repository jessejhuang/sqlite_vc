class TimeSelector {

    constructor(directoryChart,vcMap) {
                
        this.dependentCharts = {
            vcMap : vcMap,
            directoryChart : directoryChart
        };

        this.margin = {top: 20, right: 100, bottom: 50, left: 200};
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
        this.current = '2013';

        var self = this;
        return self;
        
    }

    formatData(data) {
        data = JSON.parse(data);

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

        self.years = temp['years'];
        self.data = temp['data'];
        self.max = temp['max'];

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
        let len = self.data.length;

        // TODO: IMPLEMENT AS ENTER/UPDATE/EXIT INSTEAD OF REMOVING SVG
        // TODO: ADD ANIMATION
        // TODO: FORMAT/STYLE

        // Remove old line
        d3.select("#timeSelector").html("");
        // d3.select("#timeSVG").remove();

        self.svg = d3.select("#timeSelector")
                .append("svg")
                .attr("id", "timeSVG")
                .attr("width", self.width + self.margin.left + self.margin.right)
                .attr("height", self.height + self.margin.top + self.margin.bottom)
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
                    .domain([0, self.max])
                    .range([this.margin.top+this.height, this.margin.top]);


        // Axes
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        let context = self.svg.append("g")
            .attr("id", "context")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        context.append("path")
            .datum(self.data)
            .attr("id", "line")
            .attr("d", line)
            .attr("stroke", "black")
            .attr("stroke-width", "2px")
            .attr("fill", "none")
            .style("stroke-linecap", "round")
            .style("stroke-linejoin", "round");

          context.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + (self.margin.top + self.height) + ")")
              .style("font", "26px sans")
              .call(xAxis
                .tickFormat(d3.format("4")));;

          context.append("g")
                .style("font", "26px sans")
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
// class TimeSelector {

//     constructor(directoryChart,vcMap) {
        
//         // this.directoryChart = directoryChart;
        
//         this.dependentCharts = {
//             vcMap : vcMap,
//             directoryChart : directoryChart
//         };

//         this.current = '1995-Q2';
//         var self = this;
//         return self;
        
//     }

//     initiate(data) {
//         var self = this;
//         data = JSON.parse(data);
//         d3.select('[id="current"]').html("YQ"+self.current);
        
//         self.xScale = d3.scaleLinear()
//                     .domain([0, data.years.length])
//                     .range([15,485]); 
                    
//         self.svg = d3.select("#timeSelector")
//                 .append("svg")
//                 .attr("preserveAspectRatio", "xMinYMin meet")
//                 .attr("viewBox", "0 0 500 50");
        
        
//         self.line = d3.line()
//             .x(function(d,i){return self.xScale(i);})
//             .y(function(){return 5;})
//             .curve(d3.curveLinear);
            
//         self.lines = self.svg.append("g");
//         self.dates = self.svg.append("g");
//         self.group = self.svg.append("g");
        
//     }

//     update(data) {
//         data = JSON.parse(data);
//         console.log("Data received: " + data.years);
        
//         var self = this;
  
//         var lines = self.lines.selectAll("path").data(data.years);
//         lines.enter().remove();
//         lines.enter().append("path").merge(lines)
//             .attr("d", self.line(data.years))
//             .attr("fill", "none")
//             .attr("stroke", "gray")
//             .attr("class", "link");

           
//         var dates = self.dates.selectAll("text").data(data.years);
//         dates.exit().remove();
//         dates.enter().append('g')
//             .attr("transform",function(d,i) {return "translate("+self.xScale(i)+","+30+")"; })
//             .append("text").merge(dates)
//             .text(function(d) { return d; })
//             .attr('id', function(d){return d;})
//             .style('fill', 'black')
//             .attr("class","datetext")
//             .attr("transform", function() {
//                 return "rotate(-60)"
//             });
//         //                        
//         var group = self.group.selectAll("circle").data(data.years);
//         group.exit().remove();
//         group.enter().append("circle").merge(group)
//             .attr("id",function(d) { return "YQ"+d; })
//             .attr("cx", function(d,i){  return self.xScale(i);})
//             .attr("cy", 5)
//             .attr("fill",function(){
//                return 'gray';
//              })
//             .attr("r", 2)
//             .attr('fill-opacity', 1.0)
//             .attr("stroke",'none')
//             .attr("stroke-width",0.7)
//             .on('mouseover',function(){d3.select(this).attr("stroke","black").attr("stroke-width",0.8);})
//             .on('mouseout',function(){
//                 d3.select(this).attr("stroke","none").attr("stroke-width",0);
//                 d3.select('[id=YQ'+self.current+']').attr("stroke","black").attr("stroke-width",0.8);
            
//             })
//             .on('click', function(d){
//                 d3.select('[id=YQ'+self.current+']').attr("stroke","none").attr("stroke-width",0.8);
//                 self.refreshMap(d);
//                 self.current = d;
//                 d3.select('[id=YQ'+d+']').attr("stroke","black").attr("stroke-width",0.8);
                
//              });
            
//         d3.select('[id=YQ'+self.current+']').attr("stroke","black").attr("stroke-width",0.8);  


//     }
//     refreshMap(year){
//         var self = this;
//         self.current = year;
//         self.dependentCharts.vcMap.changeYear(year);
//         console.log("Updating year");
//         self.dependentCharts.directoryChart.changeYear(year);            
//     }
// }