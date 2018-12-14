class TimeSelector {

    constructor(directoryChart,vcMap) {
        
        // this.directoryChart = directoryChart;
        
        this.dependentCharts = {
            vcMap : vcMap,
            directoryChart : directoryChart
        };

        this.current = '1995-Q2';
        var self = this;
        return self;
        
    }

    initiate(data) {
        var self = this;
        data = JSON.parse(data);
        d3.select('[id="current"]').html("YQ"+self.current);
        
        self.xScale = d3.scaleLinear()
                    .domain([0, data.years.length])
                    .range([15,485]); 
                    
        self.svg = d3.select("#timeSelector")
                .append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 500 50");
        
        
        self.line = d3.line()
            .x(function(d,i){return self.xScale(i);})
            .y(function(){return 5;})
            .curve(d3.curveLinear);
            
        self.lines = self.svg.append("g");
        self.dates = self.svg.append("g");
        self.group = self.svg.append("g");
        
    }

    update(data) {
        data = JSON.parse(data);
        console.log("Data received: " + data.years);
        
        var self = this;
  
        var lines = self.lines.selectAll("path").data(data.years);
        lines.enter().remove();
        lines.enter().append("path").merge(lines)
            .attr("d", self.line(data.years))
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("class", "link");

           
        var dates = self.dates.selectAll("text").data(data.years);
        dates.exit().remove();
        dates.enter().append('g')
            .attr("transform",function(d,i) {return "translate("+self.xScale(i)+","+30+")"; })
            .append("text").merge(dates)
            .text(function(d) { return d; })
            .attr('id', function(d){return d;})
            .style('fill', 'black')
            .attr("class","datetext")
            .attr("transform", function() {
                return "rotate(-60)"
            });
        //                        
        var group = self.group.selectAll("circle").data(data.years);
        group.exit().remove();
        group.enter().append("circle").merge(group)
            .attr("id",function(d) { return "YQ"+d; })
            .attr("cx", function(d,i){  return self.xScale(i);})
            .attr("cy", 5)
            .attr("fill",function(){
               return 'gray';
             })
            .attr("r", 2)
            .attr('fill-opacity', 1.0)
            .attr("stroke",'none')
            .attr("stroke-width",0.7)
            .on('mouseover',function(){d3.select(this).attr("stroke","black").attr("stroke-width",0.8);})
            .on('mouseout',function(){
                d3.select(this).attr("stroke","none").attr("stroke-width",0);
                d3.select('[id=YQ'+self.current+']').attr("stroke","black").attr("stroke-width",0.8);
            
            })
            .on('click', function(d){
                d3.select('[id=YQ'+self.current+']').attr("stroke","none").attr("stroke-width",0.8);
                self.refreshMap(d);
                self.current = d;
                d3.select('[id=YQ'+d+']').attr("stroke","black").attr("stroke-width",0.8);
                
             });
            
        d3.select('[id=YQ'+self.current+']').attr("stroke","black").attr("stroke-width",0.8);  


    }
    refreshMap(year){
        var self = this;
        self.current = year;
        self.dependentCharts.vcMap.changeYear(year);
        console.log("Updating year");
        self.dependentCharts.directoryChart.changeYear(year);            
    }
}