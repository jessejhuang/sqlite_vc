class ProfileChart {

    constructor(DB) {
        this.margin = {top: 20, right: 100, bottom: 50, left: 200};
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
        this.width_full = 1200;
        this.height_full = 300;
        this.fontSize = 14;
        this.db = DB;
        this.modal = M.Modal.getInstance($('#profModal').modal());
        d3.select('#exitProfModal')
            .on('click', () => {
                this.modal.close();
            });

        this.headerSVG = d3.select('#profileHeader').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profHeaderSVG');

        this.summarySVG = d3.select('#profSummary').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profSummarySVG');

        this.cdfSVG = d3.select('#profCDF').append('svg')
            .attr('id', 'profCdfSVG')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width_full+" "+this.height_full)
            .attr("align","center");

        this.barSVG = d3.select('#profBar').append('svg')
            .attr('id', 'profBarSVG')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width_full+" "+this.height_full)
            .attr("align","center");

        this.scatterSVG = d3.select('#profScatter').append('svg')
            .attr('id', 'profLineSVG')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width_full+" "+this.height_full)
            .attr("align","center");

        this.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('e')
            .html(d => {
                let name = d.name;
                let amount = d.amount;
                let date = d.date;
                let type = d.type;
                let formatTime = d3.timeFormat("%B %d, %Y");
                return `
                    <h4>${name}</h4>
                    <p>Fund type: ${type}</p>
                    <p>Date of Transaction: ${formatTime(date)}</p>
                    <p>Amount: $${amount}</p>
                `;
            });
        this.cdfSVG.call(this.tooltip);
        this.barSVG.call(this.tooltip);
        this.scatterSVG.call(this.tooltip);

        this.y1 = 10; // Starting y value for data attribute
        this.initiate();
    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    initiate() {
        let self = this;
        self.headerSVG.append('svg:image')
            .attr('id', 'profileLogo')
            .attr('x', '5%')
            .attr('y', '5%')
            .attr('width', 100)
            .attr('height', 100)
            .attr('xlink:href', './images/default_logo.jpg');
        self.headerSVG.append('a')
            .attr('xlink:href', 'https://washuvis.github.io/venturecapital/docs/')
            .attr('id', 'profileLink')
            .append('text')
                .text('Venture Capital Visualizations')
                .attr('id', 'profileName')
                .attr('x', '15%')
                .attr('y', '50%')
                .style('font-size', '50px')
                .style('fill', '#0000EE');
        self.headerSVG.append('text')
            .text('Jack Grundy, Jesse Huang, John Kirchenbauer')
            .attr('id', 'profileDescription')
            .attr('x', '15%')
            .attr('y', '70%')
            .style('font-size', '15px')
        self.summarySVG.append('text')
            .text('Venture')
            .attr('id', 'profileType')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Year Founded: 2018')
            .attr('id', 'profileYearFounded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('City: St. Louis')
            .attr('id', 'profileCity')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Status: Operating')
            .attr('id', 'profileStatus')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('First Funded: 2013')
            .attr('id', 'profileFirstFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Last Funded: 2013')
            .attr('id', 'profileLastFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Total Raised: $0')
            .attr('id', 'profileTotalFunding')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
    }

    summary(data){
        let self = this;
        let companyType = data.entity_type === 'FinancialOrg' ? 'Entity Type: Venture' :
            data.entity_type === 'People' ? 'Entity Type: Person' :
            'Entity Type: VC Firm';
        let logo = data.logo_url ? data.logo_url : 'images/default_logo.jpg';
        let homepage = data.homepage_url ? data.homepage_url : 'https://www.pixar.com/404';
        let description = data.description ? data.description : data.short_description;
        let status = data['cb_objects.status'];

        let year = data['cb_funding_rounds.funded_at'];
        let yearFounded = data['founded_at'] ? data['founded_at'] : 'Unknown';
        let firstYear = data['first_funding_at'] ? data['first_funding_at'] : year;
        let lastYear = data['last_funding_at'] ? data['last_funding_at'] : year;

        let totalFunding = data.funding_total_usd
            ? data.funding_total_usd
            : '0';
        
        let funding = data['cb_funding_rounds.raised_amount_usd'];

        d3.select('#profileLogo')
            .attr('xlink:href', logo);
        d3.select('#profileLink')
            .attr('xlink:href', homepage);
        d3.select('#profileName')
            .text(data.name);
        d3.select('#profileDescription')
            .text(description);
        d3.select('#profileType')
            .text(companyType);
        d3.select('#profileYearFounded')
            .text(`Year Founded: ${yearFounded}`);
        d3.select('#profileCity')
            .text(`City: ${data.city}`);
        d3.select('#profileStatus')
            .text(`Status: ${status}`);
        
        if(companyType === 'Venture'){
            d3.select('#profileTotalFunding')
                .text(`Total Raised: $${self.numberWithCommas(totalFunding)}`);
            d3.select('#profileFirstFunded')
                .text(`First Funded: ${firstYear}`);
            d3.select('#profileLastFunded')
                .text(`Last Funded: ${lastYear}`);
            funding = funding ? funding : totalFunding;
        }
        else{
            d3.select('#profileTotalFunding').text('');
            d3.select('#profileFirstFunded').text('');
            d3.select('#profileLastFunded').text('');
        }
    }

    cdf(history){
        let self = this;
        let sum = 0;
        let cumulative = [];
        const parseDate = d3.timeParse('%Y-%m-%d');
        let dates = history.map(d => parseDate(d.date));
        for(let i = 0; i < history.length; i++){
            if(history[i].amount){
                sum += history[i].amount;
                // let year = history[i].date.match(/\d+/g)[0];
                cumulative.push({
                    amount: sum,
                    type: history[i].type,
                    // year: +year
                    date: history[i].date
                });
            }
        }

        // let years = cumulative.map(d => d.year);
        let amounts = cumulative.map(d => d.amount);
        let xScale = d3.scaleTime()
            .domain([d3.min(dates), d3.max(dates)])
            .range([0, this.width]); 

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(amounts)])
            .range([this.margin.top+this.height, this.margin.top]);

        let xAxis = d3.axisBottom().scale(xScale).ticks(5);
        let yAxis = d3.axisLeft().scale(yScale).ticks(5);
        const colors = d3.scaleOrdinal(d3.schemeCategory10)
        let valueline = d3.line()
            .x(d => xScale(parseDate(d.date)))
            .y(d => yScale(d.amount))
            .curve(d3.curveBasis);

        self.cdfSVG.append('g')
            .attr('transform', 'translate(70, 25)')
            .style('font', `${self.fontSize}px`)
            .call(yAxis);
        self.cdfSVG.append('g')
            .attr('transform', 'translate(70, 257)')
            .style('font', `${self.fontSize}px`)
            .call(xAxis);
        self.cdfSVG.append('path')
            .attr('class', 'line')
            .attr('transform', 'translate(71, 8)')
            .datum(cumulative)
            .attr('d', valueline)
            .attr('stroke-width', '2px')
            .attr('fill', 'none')
            .style('stroke-linecap', 'round')
            .style('stroke-linejoin', 'round')
            .style('stroke', 'black');
    }

    bar(history){
        let self = this;
        let bars = {}
        for(let i = 0; i < history.length; i++){
            if(!bars[history[i].funding_type]){
                bars[history[i].funding_type] = 0;
            }
            bars[history[i].funding_type] += history[i].amount;
        }
        let rounds = [];
        for(let key in bars){
            rounds.push({
                type: key,
                amount: bars[key]
            });
        }
        const xScale = d3.scaleBand()
          .range([0, this.width])
          .domain(rounds.map(d => d.type))
          .padding(0.4);
        const yScale = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(rounds, d => d.amount)]);
        const colors = d3.scaleOrdinal(d3.schemeCategory10) 

        self.barSVG.selectAll('.profBar')
            .data(rounds)
            .enter()
            .append('rect')
                .attr('class', 'profBar')
                .attr('x', d => xScale(d.type))
                .attr('y', d => yScale(d.amount))
                .attr('transform', 'translate(71, 8)')
                .attr('width', xScale.bandwidth())
                .attr('height', d => this.margin.top + this.height - yScale(d.amount) )
                .style('fill', d => colors(d.type));

        self.barSVG.append('g')
            .attr('transform', 'translate(70, 257)')
            .style('font', `${self.fontSize}px`)
            .call(d3.axisBottom(xScale));

        self.barSVG.append('g')
            .attr('transform', 'translate(70, 27)')
            .style('font', `${self.fontSize}px`)
            .call(d3.axisLeft(yScale));
        // let fundingType = data['cb_funding_rounds.funding_round_type']
        //     ? data['cb_funding_rounds.funding_round_type'] !== 'other'
        //         ? `Funding Type: ${data['cb_funding_rounds.funding_round_type']}`
        //         : 'Funding Type: Wildcard'
        //     : 'Funding Type: N/A'
    }

    scatter(name, history){
        let self = this;
        const parseDate = d3.timeParse('%Y-%m-%d');
        let dates = history.map(d => parseDate(d.date));
        let amounts = history.map(d => d.amount);
        let xScale = d3.scaleTime()
            .domain([d3.min(dates), d3.max(dates)])
            .range([0, this.width]); 

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(amounts)])
            .range([this.margin.top+this.height, this.margin.top]);

        let xAxis = d3.axisBottom().scale(xScale).ticks(5);
        let yAxis = d3.axisLeft().scale(yScale).ticks(5);
        const colors = d3.scaleOrdinal(d3.schemeCategory10)
        self.scatterSVG.append('g')
            .attr('transform', 'translate(70, 5)')
            .style('font', `${self.fontSize}px`)
            .call(yAxis);
        self.scatterSVG.append('g')
            .attr('transform', 'translate(70, 257)')
            .style('font', `${self.fontSize}px`)
            .call(xAxis);
        self.scatterSVG.selectAll('.profScatterDot')
            .data(history)
            .enter()
            .append('circle')
                .attr('class', '.profScatterDot')
                .attr('r', 10)
                .attr('cx', d => xScale(parseDate(d.date)))
                .attr('cy', d => yScale(d.amount ? d.amount : 0))
                .attr('transform', 'translate(71, 0)')
                .on('mouseover', d => {
                    let datum = {
                        name,
                        amount: d.amount,
                        type: d.type,
                        date: d.date,
                    }
                    self.tooltip.show(datum, self.scatterSVG);
                })
                .on('mouseout', () => {
                    self.tooltip.hide();
                })
                .style('fill', d => colors(d.fundingType))

    }

    update(name) {
        let self = this;
        self.scatterSVG.selectAll('*').remove();
        self.barSVG.selectAll('*').remove();
        self.cdfSVG.selectAll('*').remove();
        let query = self.db.profileQuery(name);
        self.db.processQuery(query, self.db.formatProfileData)
            .then(data => {
                self.summary(data);
                let history = data.history;
                console.log(`Name: ${name}, `, history);
                self.bar(history);
                self.scatter(name, history);
                self.cdf(history);
                self.modal.open();
            }, err => {
                console.log(err);
            });
    }

}
// EOF