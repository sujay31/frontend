import React, { Component } from 'react';
import ReactGA from 'react-ga';
import './App.css';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Line, Chart, Bar } from 'react-chartjs-2';
import { Container, Row, Col, Dropdown, Card, Button, Popover, OverlayTrigger,
    CardGroup, Accordion, ButtonToolbar } from 'react-bootstrap';
import Header from "./images/header.png"
import Footer from "./images/footer.jpg"
import informationIcon from "./images/information_icon.png";
import PosRateRenderer from './StatesDataGrid/CellRenderers/PosRateRenderer.jsx';
import CfrRenderer from './StatesDataGrid/CellRenderers/CfrRenderer.jsx';
import RtRenderer from './StatesDataGrid/CellRenderers/RtRenderer.jsx';
import CasesRenderer from './StatesDataGrid/CellRenderers/CasesRenderer.jsx';
import CumPosRateRenderer from './StatesDataGrid/CellRenderers/CumPosRateRenderer.jsx';
import CumCasesRenderer from './StatesDataGrid/CellRenderers/CumCasesRenderer.jsx';
import TPMRenderer from './StatesDataGrid/CellRenderers/TPMRenderer.jsx';
import Methods from "./Methods/Methods.js";
import Contribute from "./Contribute/Contribute.js";
import About from "./AboutUs/About.js";
import graphIcon from "./images/graphIcon.png";
import tableIcon from "./images/tableIcon.png";
import gitIcon from "./images/github.png";
import twitterIcon from "./images/twitter.png";
import mailIcon from "./images/mail.png";
import feedbackIcon from "./images/feedback.png";
import Licence from "./Licence/Licence.js";
import LinkButtons from "./LinkButtons.js"
import IndicatorDescriptionCards from "./IndicatorDescriptionCards.js"
import CfrChart from "./Plots/CfrChart.js"
import PosRateChart from "./Plots/PosRateChart.js"
import DailyTestsChart from "./Plots/DailyTestsChart.js"
import MobilityChart from "./Plots/MobilityChart.js"
import RtChart from "./Plots/RtChart.js"
import DailyCasesChart from "./Plots/DailyCasesChart.js"
import * as StateEnums from "./Commons/StateEnums.js"

class App extends Component {
	constructor(props) {
		super(props);
		this.textDivRef = React.createRef();
		this.plotsRef = React.createRef();
		this.tableRef = React.createRef();

		this.state = {
			columnDefs: [
				{
					headerName: '', children: [
						{ headerName: "STATES", field: "state", sortable: true, flex: 2, suppressMovable: true, maxWidth: "170", filter: 'agTextColumnFilter' }
					]
				},
				{
					headerName: 'TRANSMISSION', headerTooltip: "These numbers indicate the rate and scale of spread of COVID19 in a state", children: [
						{
							headerName: "RT", field: "rt", sortable: true, flex: 1, suppressMovable: true, headerTooltip: "One infectious person is further infecting this many people on average",
							cellRenderer: 'rtRenderer', comparator: this.numberSort, minWidth: 120, cellStyle: function (params) {
								let style;
								let a = true;
								params.data.rtOld.forEach(rt => {
									if (rt > 1) {
										a = false;
									}
								})
								if (params.data.rtCurrent > 1) {
									style = { backgroundColor: '#fdcbdd' };
								} else if (params.data.rtCurrent <= 1 && a === true) {
									style = { backgroundColor: '#e1fae9' };
								} else if (params.data.rtCurrent <= 1 && a === false) {
									style = { backgroundColor: '#fafae1' };
								}
								return style;
							}
						},
						{
							headerName: "CUMULATIVE CASES", field: "cumCases", sortable: true, flex: 1, suppressMovable: true, comparator: this.numberSort,
							cellRenderer: 'cumCasesRenderer', filter: 'agNumberColumnFilter', headerTooltip: "Total number of COVID+ cases detected till date"
						},
						{
							headerName: "DAILY CASES", field: "dailyCases", sortable: true, flex: 1, suppressMovable: true, headerTooltip: "Number of COVID+ cases detected per day(averaged over last 7 days)",
							cellRenderer: 'casesRenderer', filter: 'agNumberColumnFilter', comparator: this.numberSort
						}
					]
				},
				{
					headerName: 'TESTING', headerTooltip: "These numbers indicate the amount of testing being done in a state", children: [
						{
							headerName: "POSITIVITY RATE(%)", field: "posRate", sortable: true, flex: 1, suppressMovable: true, headerTooltip: "Percent of tests done per day that came back positive (averaged over last 7 days). Indicates RECENT trend",
							cellRenderer: 'posRateRenderer', comparator: this.numberSort, filter: 'agNumberColumnFilter', cellStyle: function (params) {
								let style;
								const posRateNumber = parseFloat(params.data.posRate);
								if (posRateNumber > 10) {
									style = { backgroundColor: '#fdcbdd' };
								} else if (posRateNumber <= 5) {
									style = { backgroundColor: '#e1fae9' };
								} else if (posRateNumber <= 10 && posRateNumber > 5) {
									style = { backgroundColor: '#fafae1' };
								}
								return style;
							}
						},
						{
							headerName: "CUMULATIVE POSITIVITY RATE(%)", field: "cumPosRate", sortable: true, flex: 1, suppressMovable: true, comparator: this.numberSort,
							cellRenderer: 'cumPosRateRenderer', filter: 'agNumberColumnFilter', headerTooltip: "Percent of tests done till date that came back positive"
						},
						{
							headerName: "CORRECTED CASE FATALITY RATE(%)", field: "ccfr", sortable: true, flex: 1, suppressMovable: true, filter: 'agNumberColumnFilter', comparator: this.numberSort,
							cellRenderer: 'cfrRenderer', headerTooltip: "Out of every 100 COVID+ cases whose outcome is expected to be known, this many have passed away", cellStyle: function (params) {
								let style;
								if (params.data.ccfr > 10) {
									style = { backgroundColor: '#fdcbdd' };
								} else if (params.data.ccfr <= 5) {
									style = { backgroundColor: '#e1fae9' };
								} else if (params.data.ccfr <= 10 && params.data.ccfr > 5) {
									style = { backgroundColor: '#fafae1' };
								}
								return style;
							}
						},
						{
							headerName: "TESTS PER MILLION", field: "testsPerMil", filter: 'agNumberColumnFilter', sortable: true, flex: 1, suppressMovable: true,
							cellRenderer: 'TPMRenderer', comparator: this.numberSort, headerTooltip: "Number of people tested out of every 1 million people in the state"
						}
					]
				}
			],
			rowData: [],
			pinnedTopRowData: [],
			rtDataFromApi: [],
			cfrDataFromApi: [],
			mobilityDataFromApi: [],
			positivityRateDataFromApi: [],
			nationalDataFromApi: [],
			minRtDataPoint: 0,
			maxRtDataPoint: 0,
			maxCFRPoint: 0,
			lockdownDates: ["25 March", "15 April", "04 May", "18 May", "08 June"],
			lockdownChartText: ['Lockdown 1', 'Lockdown 2', 'Lockdown 3', 'Lockdown 4', 'Unlock 1'],
			graphStartDate: '22 March',
			rtPointGraphData: { datasets: [{ data: [] }], labels: [] },
			cfrGraphData: { datasets: [{ data: [] }], labels: [] },
			mobilityGraphData: { datasets: [{ data: [] }], lables: [] },
			positivityRateGraphData: { datasets: [{ data: [] }], lables: [] },
			dailyCasesGraphData: { datasets: [{ data: [] }], lables: [] },
			dailyTestsGraphData: { datasets: [{ data: [] }], lables: [] },
			selectedState: 'India',
			selectedView: 'Home',
			mobileView: false,
			frameworkComponents: {
				posRateRenderer: PosRateRenderer,
				cfrRenderer: CfrRenderer,
				casesRenderer: CasesRenderer,
				rtRenderer: RtRenderer,
				cumPosRateRenderer: CumPosRateRenderer,
				cumCasesRenderer: CumCasesRenderer,
				TPMRenderer: TPMRenderer
			},
			lastUpdatedTime: ""
		}
	}

	columnDefMobile = [
		{
			headerName: '', children: [
				{ headerName: "STATES", field: "state", sortable: true, suppressMovable: true }
			]
		},
		{
			headerName: 'TRANSMISSION', headerTooltip: "These numbers indicate the rate and scale of spread of COVID19 in a state", children: [
				{
					headerName: "RT", field: "rt", width: 120, sortable: true, suppressMovable: true, headerTooltip: "One infectious person is further infecting this many people on average",
					cellRenderer: 'rtRenderer', comparator: this.numberSort,
					cellStyle: function (params) {
						let style;
						let a = true;
						params.data.rtOld.forEach(rt => {
							if (rt > 1) {
								a = false;
							}
						})
						if (params.data.rtCurrent > 1) {
							style = { backgroundColor: '#fdcbdd', fontSize: "x-small" };
						} else if (params.data.rtCurrent <= 1 && a === true) {
							style = { backgroundColor: '#e1fae9', fontSize: "x-small" };
						} else if (params.data.rtCurrent <= 1 && a === false) {
							style = { backgroundColor: '#fafae1', fontSize: "x-small" };
						}
						return style;
					}
				},
				{
					headerName: "CUMULATIVE CASES", field: "cumCases", width: 100, sortable: true, suppressMovable: true, headerTooltip: "Total number of COVID+ cases detected till date",
					cellRenderer: 'cumCasesRenderer', comparator: this.numberSort, cellStyle: { fontSize: "x-small" }
				},
				{
					headerName: "DAILY CASES", field: "dailyCases", width: 80, sortable: true, suppressMovable: true, headerTooltip: "Number of COVID+ cases detected per day(averaged over last 7 days)",
					cellRenderer: 'casesRenderer', comparator: this.numberSort, cellStyle: { fontSize: "x-small" }
				}
			]
		},
		{
			headerName: 'TESTING', headerTooltip: "These numbers indicate the amount of testing being done in a state", children: [
				{
					headerName: "POSITIVITY RATE(%)", field: "posRate", width: 90, sortable: true, suppressMovable: true, headerTooltip: "Percent of tests done per day that came back positive (averaged over last 7 days). Indicates RECENT trend",
					cellRenderer: 'posRateRenderer', comparator: this.numberSort, cellStyle: function (params) {
						let style;
						const posRateNumber = parseFloat(params.data.posRate);
						if (posRateNumber > 10) {
							style = { backgroundColor: '#fdcbdd', fontSize: "x-small" };
						} else if (posRateNumber <= 5) {
							style = { backgroundColor: '#e1fae9', fontSize: "x-small" };
						} else if (posRateNumber <= 10 && posRateNumber > 5) {
							style = { backgroundColor: '#fafae1', fontSize: "x-small" };
						}
						return style;
					}
				},
				{
					headerName: "CUMULATIVE POSITIVITY RATE(%)", field: "cumPosRate", width: 100, sortable: true, headerTooltip: "Percent of tests done till date that came back positive",
					cellRenderer: 'cumPosRateRenderer', suppressMovable: true, comparator: this.numberSort, cellStyle: { fontSize: "x-small" }
				},
				{
					headerName: "CORRECTED CASE FATALITY RATE(%)", field: "ccfr", width: 100, sortable: true, suppressMovable: true, comparator: this.numberSort,
					cellRenderer: 'cfrRenderer', headerTooltip: "Out of every 100 COVID+ cases whose outcome is expected to be known, this many have passed away", cellStyle: function (params) {
						let style;
						if (params.data.ccfr > 10) {
							style = { backgroundColor: '#fdcbdd', fontSize: "x-small" };
						} else if (params.data.ccfr <= 5) {
							style = { backgroundColor: '#e1fae9', fontSize: "x-small" };
						} else if (params.data.ccfr <= 10 && params.data.ccfr > 5) {
							style = { backgroundColor: '#fafae1', fontSize: "x-small" };
						}
						return style;
					}
				},
				{
					headerName: "TESTS PER MILLION", field: "testsPerMil", width: 90, sortable: true, suppressMovable: true, headerTooltip: "Number of people tested out of every 1 million people in the state",
					cellRenderer: 'TPMRenderer', comparator: this.numberSort, cellStyle: { fontSize: "x-small" }
				}
			]
		}
	];

	componentDidMount() {
		this.setData();
		ReactGA.initialize('UA-168412971-1');
		ReactGA.pageview('covidToday');
		if (window.innerWidth <= '1000') {
			this.setState({ columnDefs: this.columnDefMobile });
			this.setState({ mobileView: true });

		}

	}

	componentWillMount() {
		this.configureVerticalLinesPlugin();
	}



	async setData() {
		await axios.get('https://raw.githubusercontent.com/CovidToday/backend/master/reproduction-number-rt/rt.json')
			.then(response => {
				this.setState({ rtDataFromApi: response.data });
				this.getRtPointGraphData(this.state.rtDataFromApi.IN);
			});

		await axios.get('https://raw.githubusercontent.com/CovidToday/backend/master/testing-and-cfr/cfr.json')
			.then(response => {
				this.setState({ cfrDataFromApi: response.data });
				this.getCfrGraphData(this.state.cfrDataFromApi.India);
			});

		await axios.get('https://raw.githubusercontent.com/CovidToday/backend/master/mobility-index/india_mobility_indented.json')
			.then(response => {
				this.setState({ mobilityDataFromApi: response.data });
				this.getMobilityGraphData(this.state.mobilityDataFromApi.India);
			});

		await axios.get('https://raw.githubusercontent.com/CovidToday/backend/master/testing-and-cfr/positivity_Rate.json')
			.then(response => {
				this.setState({ positivityRateDataFromApi: response.data });
				this.getPositivityRateGraphData(this.state.positivityRateDataFromApi.India);
				this.getDailyCasesGraphData(this.state.positivityRateDataFromApi.India);
				this.getDailyTestsGraphData(this.state.positivityRateDataFromApi.India);
			});

		const lastUpdated = this.state.positivityRateDataFromApi.datetime;
		const timestamp = lastUpdated ? lastUpdated.split(":", 2).join(":") : "NA";
		this.setState({ lastUpdatedTime: timestamp });

		await axios.get('https://raw.githubusercontent.com/CovidToday/backend/master/testing-and-cfr/national.json')
			.then(response => {
				this.setState({ nationalDataFromApi: response.data });
			});

		this.setRowData();
	}

	numberSort(a, b) {
		const numA = parseFloat(a);
		const numB = parseFloat(b);

		if (numA === null && numB === null) {
			return 0;
		}
		if (numA === NaN && numB === NaN) {
			return 0;
		}
		if (numA === null || numA === NaN) {
			return -1;
		}
		if (numB === null || numB === NaN) {
			return 1;
		}

		return numA - numB;
	}

	configureVerticalLinesPlugin() {
		const verticalLinePlugin = {
			getLinePosition: function (chart, pointIndex) {
				const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
				const data = meta.data;
				if (data[pointIndex])
					return data[pointIndex]._model.x;
			},
			renderVerticalLine: function (chartInstance, pointIndex, text) {
				const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
				const scale = chartInstance.scales['y-axis-0'];
				const context = chartInstance.chart.ctx;

				// render vertical line
				context.beginPath();
				context.strokeStyle = 'rgb(0,64,101,0.3)';
				context.moveTo(lineLeftOffset, scale.top);
				context.lineTo(lineLeftOffset, scale.bottom);
				context.stroke();

				// write label
				context.fillStyle = "#004065";
				context.textAlign = 'left';
				context.font = '11px "Titillium Web"';
				context.fillText(text, lineLeftOffset, scale.top);
			},

			afterDatasetsDraw: function (chart, easing) {
				if (chart.config.plugins) {
					let linesIndex = [];
					chart.config.plugins.verticalLineAtIndex.forEach((pointIndex) => {
						let index = chart.config.data.labels.indexOf(pointIndex);
						linesIndex.push(index);
					});
					linesIndex.forEach((pointIndex, index) => {
						this.renderVerticalLine(chart, pointIndex, chart.config.plugins.lockdownChartText[index]);
					});
				}
			}
		};
		Chart.plugins.register(verticalLinePlugin);
	}

	getName = (key) => {
		return StateEnums.StateNames[key];
	}

	setRowData = () => {
		const allstates = [];
		this.state.nationalDataFromApi && this.state.nationalDataFromApi.statewise.forEach(i => {
			allstates.push(i.statecode.toLowerCase());
		});
		const states = allstates.filter(s => s !== "tt" && s !== "un" && s !== "ld");
		const data = [];
		const pinnedData = [];
		if (this.state.rtDataFromApi && this.state.cfrDataFromApi && this.state.nationalDataFromApi && this.state.positivityRateDataFromApi) {
			states && states.forEach(s => {
				const name = this.getName(s);

				//rt
				const rtIndex = this.state.rtDataFromApi[s] ? this.state.rtDataFromApi[s].rt_point.length - 1 : -1;
				const rtPoint = rtIndex > 0 ? (this.state.rtDataFromApi[s].rt_point[rtIndex]).toFixed(2) : "NA";
				const rtl95 = rtIndex > 0 ? (this.state.rtDataFromApi[s].rt_l95[rtIndex]).toFixed(2) : "NA";
				const rtu95 = rtIndex > 0 ? (this.state.rtDataFromApi[s].rt_u95[rtIndex]).toFixed(2) : "NA";
				const rtDate = rtIndex > 0 ? (this.state.rtDataFromApi[s].dates[rtIndex]) : "-";
				const rtToCompare = [];
				if (rtIndex > 13) {
					for (let i = rtIndex - 13; i <= rtIndex; i++) {
						rtToCompare.push((this.state.rtDataFromApi[s].rt_point[i]).toFixed(2));
					};
				}
				const rtData = rtPoint === "NA" ? "NA" : `${rtPoint} (${rtl95}-${rtu95})`;

				//cfr
				const cfrIndex = this.state.cfrDataFromApi[name] ? this.state.cfrDataFromApi[name].cfr3_point.length - 1 : -1;
				const cfrPoint = cfrIndex > 0 ? (this.state.cfrDataFromApi[name].cfr3_point[cfrIndex]).toFixed(2) : "NA";
				const cfrPointOld = cfrIndex > 0 ? (this.state.cfrDataFromApi[name].cfr3_point[cfrIndex - 7]).toFixed(2) : "NA";
				const cfrDate = cfrIndex > 0 ? this.state.cfrDataFromApi[name].dates[cfrIndex] : "-";

				//posRate
				const posRateArr = Object.entries(this.state.positivityRateDataFromApi);
				let cumCases;
				let cumCasesDate;
				posRateArr.forEach(data => {
					if (data[0] === name) {
						const indexCases = data[1].cum_positive_cases.slice().reverse().findIndex(i => i !== "");
						const countCases = data[1].cum_positive_cases.length - 1;
						const cumCasesIndex = indexCases >= 0 ? countCases - indexCases : indexCases;
						const cumulativeCasesFloat = data[1].cum_positive_cases[cumCasesIndex];
						cumCases = cumulativeCasesFloat && cumulativeCasesFloat !== "" ? cumulativeCasesFloat : "-";
						cumCasesDate = data[1].dates[cumCasesIndex];
					}
				});
				let cumulativePosRate;
				let cumPRateDate;
				posRateArr.forEach(data => {
					if (data[0] === name) {
						const indexCum = data[1].cum_positivity_rate.slice().reverse().findIndex(i => i !== "");
						const countCum = data[1].cum_positivity_rate.length - 1;
						const cumPosRateIndex = indexCum >= 0 ? countCum - indexCum : indexCum;
						const cumulativePosRateFloat = data[1].cum_positivity_rate[cumPosRateIndex];
						cumulativePosRate = cumulativePosRateFloat && cumulativePosRateFloat !== "" ? cumulativePosRateFloat.toFixed(2) : "NA";
						cumPRateDate = data[1].dates[cumPosRateIndex];
					}
				});
				let maCases;
				let maCasesOld;
				let maCasesDate;
				posRateArr.forEach(data => {
					if (data[0] === name) {
						const indexMACases = data[1].daily_positive_cases_ma.slice().reverse().findIndex(i => i !== "");
						const countMACases = data[1].daily_positive_cases_ma.length - 1;
						const MACasesIndex = indexMACases >= 0 ? countMACases - indexMACases : indexMACases;
						const maCasesFloat = data[1].daily_positive_cases_ma[MACasesIndex];
						const maCasesFloatOld = data[1].daily_positive_cases_ma[MACasesIndex - 7];
						maCases = maCasesFloat && maCasesFloat !== "" ? Math.floor(maCasesFloat) : "NA";
						maCasesOld = maCasesFloatOld && maCasesFloatOld !== "" ? Math.floor(maCasesFloatOld) : "NA";
						maCasesDate = data[1].dates[MACasesIndex];
					}
				});
				let maPosRate;
				let maPosRateOld;
				let posRateDate;
				posRateArr.forEach(data => {
					if (data[0] === name) {
						const indexPosRateMa = data[1].daily_positivity_rate_ma.slice().reverse().findIndex(i => i !== "");
						const countPosRateMa = data[1].daily_positivity_rate_ma.length - 1;
						const posRateMaIndex = indexPosRateMa >= 0 ? countPosRateMa - indexPosRateMa : indexPosRateMa;
						const maPosRateFloat = (data[1].daily_positivity_rate_ma[posRateMaIndex]);
						maPosRate = maPosRateFloat && maPosRateFloat !== "" ? (maPosRateFloat).toFixed(2) : "NA";
						const maPosRateFloatOld = (data[1].daily_positivity_rate_ma[posRateMaIndex - 7]);
						maPosRateOld = maPosRateFloatOld && maPosRateFloatOld !== "" ? (maPosRateFloatOld).toFixed(2) : "NA";
						posRateDate = data[1].dates[posRateMaIndex];
					}
				});
				let tpm;
				let tpmDate;
				posRateArr.forEach(data => {
					if (data[0] === name) {
						const indexTpm = data[1].test_per_million.slice().reverse().findIndex(i => i !== "");
						const countTpm = data[1].test_per_million.length - 1;
						const tpmIndex = indexTpm >= 0 ? countTpm - indexTpm : indexTpm;
						const tpmFloat = (data[1].test_per_million[tpmIndex]);
						tpm = tpmFloat && tpmFloat !== "" ? Math.floor(tpmFloat) : "-";
						tpmDate = data[1].dates[tpmIndex];
					}
				});


				data.push({
					key: s, state: name, rt: rtData, cumCases: cumCases, dailyCases: maCases, posRate: maPosRate, cumPosRate: cumulativePosRate,
					ccfr: cfrPoint, rtCurrent: rtPoint, rtOld: rtToCompare, dailyCasesOld: maCasesOld, posRateOld: maPosRateOld, cfrOld: cfrPointOld,
					rtDate: rtDate, cumCasesDate: cumCasesDate, maCasesDate: maCasesDate, posRateDate: posRateDate, cumPRateDate: cumPRateDate, cfrDate: cfrDate,
					testsPerMil: tpm, tpmDate: tpmDate
				});
			});
			data.sort(function (a, b) {
				const aNum = parseInt(a.cumCases);
				const bNum = parseInt(b.cumCases);
				return (aNum < bNum) ? 1 : -1
			});
			this.setState({ rowData: data })
		}

		const rtIndexInd = this.state.rtDataFromApi["IN"].rt_point.length - 1;
		const rtPointInd = rtIndexInd > 0 ? (this.state.rtDataFromApi["IN"].rt_point[rtIndexInd]).toFixed(2) : "NA";
		const rtl95Ind = rtIndexInd > 0 ? (this.state.rtDataFromApi["IN"].rt_l95[rtIndexInd]).toFixed(2) : "NA";
		const rtu95Ind = rtIndexInd > 0 ? (this.state.rtDataFromApi["IN"].rt_u95[rtIndexInd]).toFixed(2) : "NA";
		const rtDate = rtIndexInd > 0 ? (this.state.rtDataFromApi["IN"].dates[rtIndexInd]) : "-";
		const rtToCompareInd = [];
		if (rtIndexInd > 13) {
			for (let i = rtIndexInd - 13; i <= rtIndexInd; i++) {
				rtToCompareInd.push((this.state.rtDataFromApi["IN"].rt_point[i]).toFixed(2));
			};
		}
		const rtDataInd = `${rtPointInd} (${rtl95Ind}-${rtu95Ind})`

		const cfrIndexInd = this.state.cfrDataFromApi["India"].cfr3_point.length - 1;
		const cfrPointInd = cfrIndexInd > 0 ? (this.state.cfrDataFromApi["India"].cfr3_point[cfrIndexInd]).toFixed(2) : "NA";
		const cfrDate = cfrIndexInd > 0 ? this.state.cfrDataFromApi["India"].dates[cfrIndexInd] : "-";
		const cfrPointOld = cfrIndexInd > 0 ? (this.state.cfrDataFromApi["India"].cfr3_point[cfrIndexInd - 7]).toFixed(2) : "NA";

		const posRateArrInd = this.state.positivityRateDataFromApi.India;

		const cumConfirmedIndIndex = posRateArrInd.cum_positive_cases.slice().reverse().findIndex(i => i !== "");
		const cumConfirmedIndCount = posRateArrInd.cum_positive_cases.length - 1;
		const resultIndex = cumConfirmedIndIndex >= 0 ? cumConfirmedIndCount - cumConfirmedIndIndex : cumConfirmedIndIndex;
		const cumCasesInd = (posRateArrInd.cum_positive_cases[resultIndex]);
		const cumCasesIndDate = posRateArrInd.dates[resultIndex];

		const indexInd = posRateArrInd.cum_positivity_rate.slice().reverse().findIndex(i => i !== "");
		const countInd = posRateArrInd.cum_positivity_rate.length - 1;
		const posRateIndexInd = indexInd >= 0 ? countInd - indexInd : indexInd;
		const cumulativePosRateInd = (posRateArrInd.cum_positivity_rate[posRateIndexInd]).toFixed(2);
		const cumPRDateInd = posRateArrInd.dates[posRateIndexInd];

		const indexIndPosRateMa = posRateArrInd.daily_positivity_rate_ma.slice().reverse().findIndex(i => i !== "");
		const countIndPosRateMa = posRateArrInd.daily_positivity_rate_ma.length - 1;
		const posRateMaIndexInd = indexIndPosRateMa >= 0 ? countIndPosRateMa - indexIndPosRateMa : indexIndPosRateMa;
		const PosRateMaInd = (posRateArrInd.daily_positivity_rate_ma[posRateMaIndexInd]).toFixed(2);
		const PosRateMaIndOld = (posRateArrInd.daily_positivity_rate_ma[posRateMaIndexInd - 7]).toFixed(2);
		const posRateDateInd = posRateArrInd.dates[posRateMaIndexInd];

		const indexIndcasesMa = posRateArrInd.daily_positive_cases_ma.slice().reverse().findIndex(i => i !== "");
		const countIndcasesMa = posRateArrInd.daily_positive_cases_ma.length - 1;
		const casesMaIndexInd = indexIndcasesMa >= 0 ? countIndcasesMa - indexIndcasesMa : indexIndcasesMa;
		const casesMaInd = Math.floor(posRateArrInd.daily_positive_cases_ma[casesMaIndexInd]);
		const casesMaIndOld = Math.floor(posRateArrInd.daily_positive_cases_ma[casesMaIndexInd - 7]);
		const maCasesIndDate = posRateArrInd.dates[casesMaIndexInd];

		const indexIndTpm = posRateArrInd.test_per_million.slice().reverse().findIndex(i => i !== "");
		const countIndTpm = posRateArrInd.test_per_million.length - 1;
		const tpmIndexInd = indexIndTpm >= 0 ? countIndTpm - indexIndTpm : indexIndTpm;
		const tpmInd = Math.floor(posRateArrInd.test_per_million[tpmIndexInd]);
		const tpmIndDate = posRateArrInd.dates[tpmIndexInd];

		pinnedData.push({
			key: "IN", state: "India", rt: rtDataInd, cumCases: cumCasesInd, dailyCases: casesMaInd, posRate: PosRateMaInd, cumPosRate: cumulativePosRateInd,
			ccfr: cfrPointInd, rtCurrent: rtPointInd, rtOld: rtToCompareInd, rtDate: rtDate, cfrDate: cfrDate, cfrOld: cfrPointOld, dailyCasesOld: casesMaIndOld,
			posRateOld: PosRateMaIndOld, cumCasesDate: cumCasesIndDate, maCasesDate: maCasesIndDate, posRateDate: posRateDateInd, cumPRateDate: cumPRDateInd,
			testsPerMil: tpmInd, tpmDate: tpmIndDate
		})
		this.setState({ pinnedTopRowData: pinnedData })
	}

	getDailyCasesGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);
			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);



			// Main data
			let mainData = [{
				label: 'Daily Cases',
				data: dataFromApi.daily_positive_cases.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#004065',
				radius: 1,
			}, {
				type: 'line',
				label: 'Daily Cases Moving Average',
				data: dataFromApi.daily_positive_cases_ma.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#004065',
				radius: 1,
				fill: false
			}];
			data.datasets.push(...mainData);
			this.setState({
				dailyCasesGraphData: data,
			});
		}
	}
	getDailyTestsGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);
			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);



			// Main data
			let mainData = [{
				label: 'Daily Tests',
				data: dataFromApi.daily_tests.slice(dateIndex, dataFromApi.dates.length),
				// borderColor: '#004065',
				backgroundColor: 'rgba(225, 105, 126,0.4)',
				radius: 1,
				fill: false,
			},];
			data.datasets.push(...mainData);
			this.setState({
				dailyTestsGraphData: data,
			});
		}
	}

	getRtPointGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);
			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);

			// let maxRtDataPoint = Math.ceil(Math.max(...dataFromApi.rt_u95.slice(dateIndex, dataFromApi.dates.length)));
			// maxRtDataPoint = Math.min(maxRtDataPoint,2.5);
			let minRtDataPoint = Math.floor(Math.min(...dataFromApi.rt_l95.slice(dateIndex, dataFromApi.dates.length)));
			minRtDataPoint = Math.min(minRtDataPoint, 0.5);

			//Horizontal line
			let horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(1);
			}
			data.datasets.push({
				label: 'fixed value',
				data: horizontalLineData,
				borderColor: 'rgba(0,100,0,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});

			//The vertical lines data logic
			// let verticalLineData = [];
			// const lockdownDates = this.state.lockdownDates;
			// for (let j = 0; j < lockdownDates.length; j++) {
			// 	let obj = {
			// 		//type: 'line',
			// 		label: 'Lockdown ' + (j + 1),
			// 		backgroundColor: 'red',
			// 		borderColor: 'red',
			// 		radius: 0,
			// 		hoverRadius: 0,
			// 		data: []
			// 	};
			// 	for (let i = minRtDataPoint; i <= maxRtDataPoint; i++) {
			// 		obj.data.push({
			// 			x: lockdownDates[j],
			// 			y: i
			// 		});
			// 	}
			// 	verticalLineData.push(obj);
			// }
			// data.datasets.push(...verticalLineData);

			// Main data
			let mainData = [{
				label: 'Rt l95',
				data: dataFromApi.rt_l95.slice(dateIndex, dataFromApi.dates.length),
				fill: '2',// + (verticalLineData.length + 2),
				backgroundColor: '#d3efff',
				borderWidth: 1,
				radius: 0,
				hoverRadius: 0,
			}, {
				label: 'Rt l50',
				data: dataFromApi.rt_l50.slice(dateIndex, dataFromApi.dates.length),
				fill: '1',// + (verticalLineData.length + 3),
				backgroundColor: '#558aaf',
				borderWidth: 1,
				radius: 0,
				hoverRadius: 0,
			}, {
				label: 'Rt',
				data: dataFromApi.rt_point.slice(dateIndex, dataFromApi.dates.length),
				radius: 1,
				borderColor: '#004065',
				fill: false
			}, {
				label: 'Rt u50',
				data: dataFromApi.rt_u50.slice(dateIndex, dataFromApi.dates.length),
				fill: '-2',
				backgroundColor: '#558aaf',
				borderWidth: 1,
				radius: 0,
				hoverRadius: 0,
			}, {
				label: 'Rt u95',
				data: dataFromApi.rt_u95.slice(dateIndex, dataFromApi.dates.length),
				fill: '-4',
				backgroundColor: '#d3efff',
				borderWidth: 1,
				radius: 0,
				hoverRadius: 0,
			}];
			data.datasets.push(...mainData);
			this.setState({
				rtPointGraphData: data,
				// maxRtDataPoint: maxRtDataPoint,
				minRtDataPoint: minRtDataPoint,
			}, this.RtChartRender);
		}
	}

	getCfrGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);

			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);

			let maxCFRPoint = Math.ceil(Math.max(...dataFromApi.cfr3_point.slice(dateIndex, dataFromApi.dates.length)));
			maxCFRPoint = Math.max(maxCFRPoint, 10);
			maxCFRPoint = Math.min(maxCFRPoint, 20);

			// Horizontal line
			let horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(10);
			}
			data.datasets.push({
				label: 'upper limit',
				data: horizontalLineData,
				borderColor: 'rgba(255,0,0,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});
			horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(5);
			}
			data.datasets.push({
				label: 'lower limit',
				data: horizontalLineData,
				borderColor: 'rgba(0,100,0,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});
			const cfrDataSet = dataFromApi.cfr3_point.slice();

			// Main data
			let mainData = [{
				label: 'CFR',
				data: cfrDataSet.slice(dateIndex, cfrDataSet.length),
				borderColor: '#004065',
				radius: 1,
				fill: false
			},];
			data.datasets.push(...mainData);
			this.setState({
				cfrGraphData: data,
				maxCFRPoint: maxCFRPoint
			});
		}
	}
	getMobilityGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);
			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);

			// Horizontal line
			let horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(0);
			}
			data.datasets.push({
				label: 'fixed',
				data: horizontalLineData,
				borderColor: 'rgba(72,72,72,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});

			// Main data
			let mainData = [{
				label: 'Mobility Average',
				data: dataFromApi.average_mobility.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#004065',
				radius: 1,
				fill: false
			}, {
				label: 'Grocery and Pharmacy',
				data: dataFromApi.grocery.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#454c80',
				borderWidth: 1,
				radius: 0,
				fill: false
			}, {
				label: 'Parks',
				data: dataFromApi.parks.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#7f548f',
				borderWidth: 1,
				radius: 0,
				fill: false
			}, {
				label: 'Residential',
				data: dataFromApi.residential.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#b65b8d',
				borderWidth: 1,
				radius: 0,
				fill: false
			}, {
				label: 'Retail and Recreation',
				data: dataFromApi.retail.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#e1697e',
				borderWidth: 1,
				radius: 0,
				fill: false
			}, {
				label: 'Transit Stations',
				data: dataFromApi.transit.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#fa8467',
				borderWidth: 1,
				radius: 0,
				fill: false
			}, {
				label: 'Workplace',
				data: dataFromApi.workplace.slice(dateIndex, dataFromApi.dates.length),
				borderColor: '#ffaa52',
				borderWidth: 1,
				radius: 0,
				fill: false
			}];
			data.datasets.push(...mainData);
			this.setState({
				mobilityGraphData: data,
			});
		}
	}

	getPositivityRateGraphData = (dataFromApi) => {
		if (dataFromApi) {
			let data = {
				datasets: [],
				labels: []
			};
			let dateIndex = dataFromApi.dates.indexOf(this.state.graphStartDate);
			dateIndex = (dateIndex == -1) ? 0 : dateIndex;
			data.labels = dataFromApi.dates.slice(dateIndex, dataFromApi.dates.length);

			// Horizontal line
			let horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(10);
			}
			data.datasets.push({
				label: 'upper limit',
				data: horizontalLineData,
				borderColor: 'rgba(255,0,0,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});
			horizontalLineData = [];
			for (let i = 0; i < data.labels.length; i++) {
				horizontalLineData.push(5);
			}
			data.datasets.push({
				label: 'lower limit',
				data: horizontalLineData,
				borderColor: 'rgba(0,100,0,0.5)',
				borderWidth: 2,
				fill: false,
				radius: 0,
				hoverRadius: 0,
			});
			const positivityRateDataSet = dataFromApi.daily_positivity_rate_ma.slice();

			// Main data
			let mainData = [{
				label: 'Positivity Rate',
				data: positivityRateDataSet.slice(dateIndex, positivityRateDataSet.length),
				borderColor: '#004065',
				radius: 1,
				fill: false
			},];
			data.datasets.push(...mainData);
			this.setState({
				positivityRateGraphData: data,
			});
		}
	}

	onSelectionChanged = (data) => {
		const selectedRows = data.api.getSelectedRows();
		const selectedState = selectedRows[0].key;
		const state = this.getName(selectedState);
		this.getRtPointGraphData(this.state.rtDataFromApi[selectedState]);
		this.getCfrGraphData(this.state.cfrDataFromApi[state]);
		this.getMobilityGraphData(this.state.mobilityDataFromApi[state]);
		this.getPositivityRateGraphData(this.state.positivityRateDataFromApi[state]);
		this.getDailyCasesGraphData(this.state.positivityRateDataFromApi[state]);
		this.getDailyTestsGraphData(this.state.positivityRateDataFromApi[state]);
		this.setState({ selectedState: state });
	}

	onStateSelect(key) {
		const stateName = this.getName(key);
		this.setState({ selectedState: stateName });
		this.getRtPointGraphData(this.state.rtDataFromApi[key]);
		this.getMobilityGraphData(this.state.mobilityDataFromApi[stateName]);
		this.getPositivityRateGraphData(this.state.positivityRateDataFromApi[stateName]);
		this.getCfrGraphData(this.state.cfrDataFromApi[stateName]);
		this.getDailyCasesGraphData(this.state.positivityRateDataFromApi[stateName]);
		this.getDailyTestsGraphData(this.state.positivityRateDataFromApi[stateName]);
	}

	DropdownRenderer = () => {
		const fontSize = this.state.mobileView ? "x-small" : "inherit";

		return <div className="sub-header-row sticky-top">
			{!this.state.mobileView && <span className="header-bar-text"> </span>}
			<span className="header-bar-text" style={{ fontSize: fontSize }}>Last Updated -{this.state.mobileView && <br />} {this.state.lastUpdatedTime}</span>
			<span className="header-bar-dropdown">
				<Dropdown>
					<Dropdown.Toggle variant="success" id="dropdown-basic" className="dropdown-state">
						{this.state.selectedState}
					</Dropdown.Toggle>

					<Dropdown.Menu className="dropdown-state-list">
						<Dropdown.Item onSelect={() => this.onStateSelect("IN")}>India</Dropdown.Item>
						{this.state.rowData && this.state.rowData.map((item) => {
							return <Dropdown.Item onSelect={() => this.onStateSelect(item.key)}>{this.getName(item.key)}</Dropdown.Item>
						})}
					</Dropdown.Menu>
				</Dropdown>
			</span>
			<span className="header-bar-text">
				<img src={graphIcon} className="quicklink-icon" onClick={() => this.scrollToPlots()} />
				<span style={{ marginRight: "15px" }}> </span>
				<img src={tableIcon} className="quicklink-icon" onClick={() => this.scrollToTable()} /></span>
			{!this.state.mobileView && <span className="header-bar-text"> </span>}
		</div>
	}

	handleDivScroll = (event) => {
		if (this.textDivRef.current) {
			this.textDivRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			})
		}
	}

	handleDashboardScroll = () => {
		if (this.plotsRef.current) {
			setTimeout(() => { this.scrollToPlots() }, 800);
		}
	}

	scrollToPlots = (event) => {
		if (this.plotsRef.current) {
			this.plotsRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			})
		}
	}

	scrollToTable = (event) => {
		if (this.tableRef.current) {
			this.tableRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			})
		}
	}


	render() {

		const popoverFont = this.state.mobileView ? "smaller" : "1 rem";
		const popoverMaxWidth = this.state.mobileView ? "216px" : "276px";

		const { positivityRateGraphData, selectedView, mobileView } = this.state;
		const dailyCasesPopover = (
			<Popover id="dailycases-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Daily Positive Cases</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					The solid line represents the 7-day moving average of daily new COVID cases.
				</Popover.Content>
			</Popover>
		);

		const dailyTestsPopover = (
			<Popover id="dailytests-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Daily Tests</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					The number of tests done daily.
				</Popover.Content>
			</Popover>
		);

		const rtPopover = (
			<Popover id="rt-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Effective Reproduction Number (Rt)</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					Rt is the average number of people infected by a single case at a particular time during the outbreak.<br />
					Green line at Rt=1 below which epidemic is controlled.<br />
					Dark band and light band show 50% and 95% confidence intervals respectively.
				</Popover.Content>
			</Popover>
		);

		const cfrPopover = (
			<Popover id="cfr-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Corrected Case Fatality Rate (CFR)</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					Out of every 100 COVID+ cases whose outcome is expected to be known, this many have passed away. Lower corrected CFR means better testing in general.
					<br />The corrected CFR is naturally high early in the epidemic and indicates low testing at that time. <br />Interpret with caution where healthcare capacity is overwhelmed.
				</Popover.Content>
			</Popover>
		);

		const mobilityPopover = (
			<Popover id="mobility-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Mobility Index</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					This indicates the % change in the movement of people at various places compared to January 2020.
				</Popover.Content>
			</Popover>
		);

		const positivityPopover = (
			<Popover id="positivity-popover" style={{ maxWidth: popoverMaxWidth }}>
				<Popover.Title as="h3" style={{ fontSize: popoverFont }}>Positivity Rate</Popover.Title>
				<Popover.Content style={{ fontSize: popoverFont }}>
					Percent of tests done per day that came back positive (7-day moving average). Lower positivity rate means better testing.
					Positivity rate below green line (less than 5%) indicates good testing, between green and red line (5-10%) indicates need for improvement, and above red line (more than 10%) indicates poor testing.
				</Popover.Content>
			</Popover>
		);
		const fontSizeDynamic = mobileView ? "smaller" : "larger";
		const fontSizeDynamicSH = mobileView ? "small" : "larger";
		const fontSizeDynamicHeading = mobileView ? "medium" : "x-large";
		const tabFontSize = window.innerWidth > '1058' ? "larger" : window.innerWidth > '1028' ? "large" : window.innerWidth > '1000' ? "medium" :
			window.innerWidth > '500' ? "large" : "small";
		const licenceWidth = mobileView ? "45px" : "90px";
		const licenceFont = mobileView ? "x-small" : "small";

		return (
			<div>
				<div>
					<span className={mobileView ? "header-pic-container-mobile" : "header-pic-container"}>
						<img src={Header} className={mobileView ? "header-pic-mobile" : "header-pic"} />
					</span>
					<span className={mobileView ? "nav-button-group-mobile" : "nav-button-group"}>
						<span className={mobileView ? "nav-bar-mobile" : "nav-bar"}>
							<Button variant="outline-primary" style={{ fontSize: tabFontSize }} className="nav-button"
								onClick={() => this.setState({ selectedView: "Home" }, this.handleDashboardScroll)}>Dashboard</Button>
						</span>
						<span className={mobileView ? "nav-bar-mobile" : "nav-bar"}>
							<Button variant="outline-primary" style={{ fontSize: tabFontSize }} className="nav-button"
								onClick={() => this.setState({ selectedView: "Methods" })}>Methods</Button>
						</span>
						<span className={mobileView ? "nav-bar-mobile" : "nav-bar"}>
							<Button variant="outline-primary" style={{ fontSize: tabFontSize }} className="nav-button"
								onClick={() => this.setState({ selectedView: "Contribute" })}>Contribute</Button>
						</span>
						<span className={mobileView ? "nav-bar-mobile" : "nav-bar"}>
							<Button variant="outline-primary" style={{ fontSize: tabFontSize }} className="nav-button"
								onClick={() => this.setState({ selectedView: "Team" })}>About Us</Button>
						</span>
					</span>
					<span>
					</span>

				</div>

				<br />
				{selectedView === "Home" && <>
					<div className="App">

						<div className="home-text">
							<div className="for-the-people-heading" style={{ fontSize: fontSizeDynamicHeading }}>Tracking India's Progress Through The Coronavirus Pandemic, Today</div>
							<div className="for-the-people-heading" style={{ fontSize: fontSizeDynamicSH, fontWeight: "bolder" }}>Understanding Your State's Response Through Live Outbreak Indicators</div>
							<div className="disclaimer-top" style={{ fontSize: fontSizeDynamic }}>How fast is the virus spreading in my state? How is the movement of people changing with lifting of restrictions?
							Is my state testing enough people to reopen safely? How good is the healthcare response of my state? Knowledge is power, and these are some questions we want to help answer
							for you. This dashboard streamlines and analyses raw data (number of daily cases, number of tests done etc) to calculate and visualise outbreak indicators
								for each state in realtime. Lockdown lifting should ideally be based on monitoring these indicators and adapting accordingly.</div><br />
							<Accordion>
								<Card>
									<Card.Header>
										<div className="top-text-title" style={{ fontSize: fontSizeDynamicHeading, textAlign: "center", fontWeight: "bolder" }}>
											Reliable Scientific Data for Policymakers, Researchers, Journalists and Citizens</div>
										<span className="disclaimer-top" style={{ fontSize: fontSizeDynamicSH, fontWeight: "bolder" }}>We do the hard work for you, so you can focus on what the data means.</span>
										<Accordion.Toggle className="accordion-button" variant="link" eventKey="1">
											<span style={{ fontSize: fontSizeDynamic }}>How?</span>
										</Accordion.Toggle>
									</Card.Header>
									<Accordion.Collapse eventKey="1">
										<Card.Body>

											<Card.Text className="top-text-body">
												<div style={{ fontSize: fontSizeDynamic }}>
													<ul>
														<li>All data made available for running your own analyses </li>
														<li>Cleaning and integrating data from multiple sources </li>
														<li>Analysing the data using robust statistical methods </li>
														<li>Correcting for known biases in estimation to give a truer picture the outbreak </li>
														<li>Using latest scientific evidence and advisories to guide interpretation </li>
														<li>Updated daily for all states of India (where data is available) </li>
														<li>Enabling understanding of outbreak indicators through easy explanation and data visualisation</li>
													</ul></div>
											</Card.Text>
										</Card.Body>
									</Accordion.Collapse>
								</Card>
								<div style={{ paddingTop: "5px" }}>
									<Button variant="outline-primary" className={mobileView ? "scroll-button-mobile" : "scroll-button"} onClick={this.handleDivScroll}>
										<span style={{ fontSize: fontSizeDynamic }}>Know about the indicators</span></Button></div>
							</Accordion>
						</div>

						<this.DropdownRenderer />
						<div ref={this.plotsRef} style={{ textDecorationColor: "white", height: "5px" }}>.</div>
						{!mobileView && <div className="plot-headers">
							<span className="span-plot-title"><hr class="hr-text" data-content="How fast is the spread?" /></span>
							<span className="span-plot-title"><hr class="hr-text" data-content="Are we testing enough?" /></span>
						</div>}

						<Container>
							<Row>
								<Col lg="6">
									{mobileView && <div className="plot-headers">
										<span className="span-plot-title-mobile"><hr class="hr-text" data-content="How fast is the spread?" /></span>
									</div>}
									{/* Daily Cases Graph */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Daily Positive Cases
												<OverlayTrigger placement="left" overlay={dailyCasesPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="rtgraph">
													<DailyCasesChart
													    dailyCasesGraphData={this.state.dailyCasesGraphData}
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													/>
												</div>
											</Card>
										</Col>
									</Row>
									<div className="mt-2"></div>
									{/* RT Graph */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Effective Reproduction Number
												<OverlayTrigger placement="left" overlay={rtPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="rtgraph">
													<RtChart
													    minRtDataPoint={this.state.minRtDataPoint}
													    maxRtDataPoint={this.state.maxRtDataPoint}
													    rtPointGraphData={this.state.rtPointGraphData}
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													/>
												</div>
											</Card>
										</Col>
									</Row>
									<div className="mt-2"></div>
									{/* Mobility Graph */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Mobility Index (% change from pre-lockdown)
												<OverlayTrigger placement="left" overlay={mobilityPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="mobilityGraph">
													<MobilityChart
													    mobilityGraphData={this.state.mobilityGraphData}
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													/>
												</div>
											</Card>
										</Col>
									</Row>
								</Col>
								<Col>
									{mobileView && <div className="mt-2"></div>}
									{mobileView && <div className="plot-headers">
										<span className="span-plot-title-mobile"><hr class="hr-text" data-content="Are we testing enough?" /></span>
									</div>}
									{/* Daily Tests */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Daily Tests
												<OverlayTrigger placement="left" overlay={dailyTestsPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="rtgraph">
													<DailyTestsChart
													    dailyTestsGraphData={this.state.dailyTestsGraphData}
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													/>
												</div>
											</Card>
										</Col>
									</Row>
									<div className="mt-2"></div>
									{/* Pos Rate Graph */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Positivity Rate (%)
												<OverlayTrigger placement="left" overlay={positivityPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="positivityrate-graph">
													<PosRateChart
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													    positivityRateGraphData={positivityRateGraphData}
													/>
												</div>
											</Card>
										</Col>
									</Row>
									<div className="mt-2"></div>
									{/* CFR Graph */}
									<Row>
										<Col>
											<Card className={mobileView ? "shadow" : "plots-card shadow"}>
												<h5 className="mb-0 mt-2 plot-heading font-weight-bold" style={{ fontSize: fontSizeDynamic }}>Corrected Case Fatality Rate (%)
												<OverlayTrigger placement="left" overlay={cfrPopover}>
														<img src={informationIcon} className="ml-1 information-icon" alt="information png" />
													</OverlayTrigger>
												</h5>
												<div className="cfr-graph">
													<CfrChart
													    cfrGraphData={this.state.cfrGraphData}
													    lockdownDates={this.state.lockdownDates}
													    lockdownChartText={this.state.lockdownChartText}
													    maxCFRPoint={this.state.maxCFRPoint}
													/>
												</div>
											</Card>
										</Col>
									</Row>
								</Col>
							</Row>
						</Container>


						<div className="sub-header-row mt-4">
							<span className="header-bar-text">LATEST STATEWISE DATA</span>
						</div>
						<div className={mobileView ? "table-info-mobile" : "table-info"} style={{ backgroundColor: "white" }}>
							<Accordion>
								<Card>
									<Card.Header style={{ textAlign: "center" }}>
										<Accordion.Toggle as={Button} variant="link" eventKey="0">
											<img src={informationIcon} className="ml-1 information-icon" />
											{` Click here to know how to use the table`}
										</Accordion.Toggle>
									</Card.Header>
									<Accordion.Collapse eventKey="0">
										<Card.Body>
											<div>
												<b>How to interact with the table</b><br />
										Click on the parameter heading to sort states in order of that parameter. <br />
										Click on the state to load data for that state in the graphs above.<br />
										Hover on the headings for more info about the parameter.<br />
										Hover on the cells to see the date for which parameter is shown.<br /><br />

												<b>What do the colours mean</b><br />
										Up and Down arrows indicate change in respective parameters as compared to 7 days ago. <br />
												{`Rt is Red: >1, Yellow: <1 for less than 2 weeks, Green: < 1 for more than 2 weeks (based on WHO criteria).`} <br />
												{`Positivity Rate is Red: >10%, Yellow: 5-10%, Green: < 5% (based on WHO criteria).`} <br />
												{`Corrected CFR is Red: >10%, Yellow: 5-10%, Green: < 5%.`} <br /><br />

										Understand what the parameters mean
										<a className="link-text" style={{ color: "blue" }} onClick={this.handleDivScroll}> here</a>.<br />
										Raw data sources and detailed method of calculation
										<a className="link-text" style={{ color: "blue" }} onClick={() => this.setState({ selectedView: "Methods" }, window.scrollTo(0, 0))}> here</a>.
									</div>
										</Card.Body>
									</Accordion.Collapse>
								</Card>
							</Accordion>
						</div>
						<Container>
							<div ref={this.tableRef}
								id="myTable"
								className="ag-theme-balham"
								style={!this.state.mobileView ? {
									padding: '20px'
								} : { paddingTop: '20px' }}
							>
								<AgGridReact
									columnDefs={this.state.columnDefs}
									rowData={this.state.rowData}
									rowSelection={"single"}
									frameworkComponents={this.state.frameworkComponents}
									headerHeight={window.innerWidth < '1200' ? '60' : '48'}
									domLayout='autoHeight'
									pinnedTopRowData={this.state.pinnedTopRowData}
									onSelectionChanged={this.onSelectionChanged.bind(this)} />
							</div>
						</Container>
					</div>
					<div className="sub-header-row mt-4">
						<span className="header-bar-text">Know about the indicators</span>
					</div>

					<div className="home-text" ref={this.textDivRef}>
					    <IndicatorDescriptionCards fontSize={fontSizeDynamic}/>
					</div>
					<div className="disclaimer" style={{ fontSize: fontSizeDynamic }}>The raw data sources and detailed method of calculation is provided in the
						<a className="link-text" style={{ color: "blue" }} onClick={() => this.setState({ selectedView: "Methods" }, window.scrollTo(0, 0))}> Methods</a> page.
						Caution should be used in interpretation as the transmission and testing indicators are not entirely independent, and one may affect the other.
						We use best practices in all calculations, however some inadvertent errors may creep in despite our efforts.
						<a className="link-text" style={{ color: "blue" }} onClick={() => this.setState({ selectedView: "Contribute" }, window.scrollTo(0, 0))}> Report an error.</a></div>

					<LinkButtons fontSize={fontSizeDynamic}/>

					<div class="wrapper"><div class="divider div-transparent" style={{ marginTop: "10px" }}></div></div>
					<div className="for-the-people">
						<div className="for-the-people-heading" style={{ fontSize: fontSizeDynamic }}>For The People, By The People</div>
						<div className="for-the-people-text" style={{ fontSize: fontSizeDynamic }}>COVID TODAY is an initiative by iCART, a multidisciplinary volunteer team of passionate doctors,
						researchers, coders, and public health experts from institutes across India.
						<a className="link-text" style={{ color: "blue" }} onClick={() => this.setState({ selectedView: "Team" }, window.scrollTo(0, 0))}> Learn more about the team</a>. This pandemic demands everyone to
						come together so that we can gradually move towards a new normal in the coming months while ensuring those who are vulnerable are protected.
						We envisage this platform to grow with your contribution and we welcome anyone who can contribute meaningfully to the project. Head over to
						the <a className="link-text" style={{ color: "blue" }} onClick={() => this.setState({ selectedView: "Contribute" }, window.scrollTo(0, 0))}>Contribute </a>page to see how you can pitch in.
						</div>
					</div>
				</>}
				{selectedView === "Methods" && <div className="App"><Methods /></div>}
				{selectedView === "Contribute" && <div className="App"><Contribute /></div>}
				{selectedView === "Team" && <div className="App"><About /></div>}
				<div className="footer-pic-container">
					<img src={Footer} className="footer-pic" onClick={() => this.setState({ selectedView: "Team" }, window.scrollTo(0, 0))} />
				</div>
				<Licence font={licenceFont} width={licenceWidth}/>
			</div>
		);
	}
}

export default App;
