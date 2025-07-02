import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserCharts, saveChart } from '../store/chartSlice';
import { addSavedChart } from '../store/localHistorySlice';
import { useNavigate, useLocation } from 'react-router-dom';
import Chart from 'chart.js/auto';
import SideNav from '../components/SideNav.jsx';
import jsPDF from 'jspdf';

const chartTypes = [
  { label: '2D Charts', options: [
    { label: 'Bar Chart', value: 'bar' },
    { label: 'Line Chart', value: 'line' },
    { label: 'Pie Chart', value: 'pie' },
    { label: 'Scatter Plot', value: 'scatter' },
  ]},
  { label: '3D Charts', options: [
    { label: '3D Column Chart', value: '3d-column' },
    { label: '3D Bar Chart', value: '3d-bar' },
  ]},
];

const ChartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const uploads = useSelector((state) => state.upload.uploads || []);
  const userCharts = useSelector((state) => state.chart.charts);
  const savedCharts = useSelector((state) => state.localHistory ? state.localHistory.savedCharts : []);
  const user = useSelector((state) => state.auth.user);
  const adminThemeMode = useSelector((state) => state.adminSettings.settings.themeMode);
  const userThemeMode = useSelector((state) => state.userSettings?.settings?.themeMode);
  const themeMode = user && user.role === 'admin' ? adminThemeMode : userThemeMode || 'white';
  const [selectedUploadIndex, setSelectedUploadIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartInstance, setChartInstance] = useState(null);

  // New state to track selected charts for deletion
  const [selectedCharts, setSelectedCharts] = useState([]);

  // Toggle selection of a chart by ID
  const toggleSelectChart = (chartId) => {
    setSelectedCharts((prevSelected) =>
      prevSelected.includes(chartId)
        ? prevSelected.filter((id) => id !== chartId)
        : [...prevSelected, chartId]
    );
  };

  // Delete selected charts
  const handleDeleteSelectedCharts = () => {
    if (selectedCharts.length === 0) {
      alert('Please select at least one chart to delete.');
      return;
    }
    // Dispatch deleteChart for each selected chart ID
    selectedCharts.forEach((chartId) => {
      dispatch(deleteChart(chartId));
    });
    // Clear selection after deletion
    setSelectedCharts([]);
  };

  useEffect(() => {
    dispatch(fetchUserCharts());
  }, [dispatch]);

  useEffect(() => {
    if (location.state && typeof location.state.selectedUploadIndex === 'number') {
      setSelectedUploadIndex(location.state.selectedUploadIndex);
    }
  }, [location.state]);

  const uploadedData = uploads.length > 0 ? uploads[selectedUploadIndex]?.data || [] : [];
  const columns = uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [];

  const colorPalette = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(255, 99, 255, 0.6)',
    'rgba(99, 255, 132, 0.6)',
  ];

  const borderColorPalette = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(255, 99, 255, 1)',
    'rgba(99, 255, 132, 1)',
  ];

  const generateChart = () => {
    if (!title || !chartType || !xAxis || !yAxis) {
      alert('Please fill all fields');
      return;
    }
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Generate colors for each data point or dataset
    const dataLength = uploadedData.length;
    const backgroundColors = [];
    const borderColors = [];

    if (chartType === 'line' || chartType === 'scatter') {
      // For line and scatter, assign colors per dataset (single dataset here)
      backgroundColors.push(colorPalette[0]);
      borderColors.push(borderColorPalette[0]);
    } else {
      // For bar, pie, doughnut, 3d charts assign colors per data point
      for (let i = 0; i < dataLength; i++) {
        backgroundColors.push(colorPalette[i % colorPalette.length]);
        borderColors.push(borderColorPalette[i % borderColorPalette.length]);
      }
    }

    const data = {
      labels: uploadedData.map((row) => row[xAxis]),
      datasets: [
        {
          label: yAxis,
          data: uploadedData.map((row) => row[yAxis]),
          backgroundColor:
            chartType === 'pie' || chartType === 'doughnut'
              ? backgroundColors
              : chartType === 'bar' || chartType === '3d-column' || chartType === '3d-bar'
              ? backgroundColors
              : chartType === 'line' || chartType === 'scatter'
              ? backgroundColors[0]
              : 'rgba(54, 162, 235, 0.6)',
          borderColor:
            chartType === 'pie' || chartType === 'doughnut'
              ? borderColors
              : chartType === 'bar' || chartType === '3d-column' || chartType === '3d-bar'
              ? borderColors
              : chartType === 'line' || chartType === 'scatter'
              ? borderColors[0]
              : 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          fill: chartType === 'line' ? false : true,
          pointBackgroundColor: chartType === 'scatter' ? backgroundColors[0] : undefined,
          pointBorderColor: chartType === 'scatter' ? borderColors[0] : undefined,
        },
      ],
    };

    const newChartInstance = new Chart(ctx, {
      type: chartType === '3d-column' || chartType === '3d-bar' ? 'bar' : chartType,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2.5,
        animation: {
          duration: 0,
        },
        layout: {
          padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },
        },
        plugins: {
          legend: { display: true },
          title: { display: true, text: title },
        },
        scales: {
          x: {
            ticks: {
              color: themeMode === 'dark' ? 'white' : 'black',
            },
            grid: {
              color: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          },
          y: {
            ticks: {
              color: themeMode === 'dark' ? 'white' : 'black',
            },
            grid: {
              color: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          },
        },
      },
      onResize: (chart, size) => {
        // Prevent chart from shrinking on resize
        chart.canvas.style.height = '900px';
        chart.canvas.style.width = '100%';
        chart.resize();
      },
    });
    setChartInstance(newChartInstance);
  };

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSaveAnalysis = async () => {
    if (!title || !chartType || !xAxis || !yAxis) {
      alert('Please fill all fields before saving');
      return;
    }
    const dataToSave = uploadedData;
    const savedTitle = title || 'saved';
    const canvas = document.getElementById('chartCanvas');
    const chartImage = canvas ? canvas.toDataURL('image/png') : null;
    setSaveLoading(true);
    setSaveError(null);
    try {
      await dispatch(saveChart({ fileName: uploads[selectedUploadIndex]?.filename || '', title: savedTitle, chartType, xAxis, yAxis, data: dataToSave, chartImage })).unwrap();
      dispatch(addSavedChart({ fileName: uploads[selectedUploadIndex]?.filename || '', title: savedTitle, chartType, xAxis, yAxis, data: dataToSave, chartImage }));
      alert('Chart saved successfully');
      await dispatch(fetchUserCharts());
    } catch (error) {
      setSaveError(error || 'Failed to save chart');
    } finally {
      setSaveLoading(false);
    }
  };

  const downloadChartAsPNG = () => {
    if (!chartInstance) {
      alert('Please generate a chart first');
      return;
    }
    const link = document.createElement('a');
    link.download = `${title || 'chart'}.png`;
    link.href = document.getElementById('chartCanvas').toDataURL('image/png');
    link.click();
  };

  const downloadChartAsPDF = () => {
    if (!chartInstance) {
      alert('Please generate a chart first');
      return;
    }
    const canvas = document.getElementById('chartCanvas');
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title || 'chart'}.pdf`);
  };

  return (
    <div className={`flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 p-6 min-h-screen ${themeMode === 'dark' ? 'bg-gray-900 text-white' : themeMode === 'creative' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-black'}`} style={{ height: '100vh' }}>
      <SideNav />
      <div className="flex-1 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6" style={{ height: '100%' }}>
        <div className={`md:w-1/3 rounded-lg shadow-lg flex flex-col ${themeMode === 'dark' ? 'bg-gray-800' : themeMode === 'creative' ? 'bg-purple-700 bg-opacity-80' : 'bg-white'}`} style={{ padding: '1.5rem' }}>
          <h2 className="text-2xl font-extrabold mb-6 text-gray-800">Create a New Chart</h2>
          <select
            className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedUploadIndex}
            onChange={(e) => setSelectedUploadIndex(Number(e.target.value))}
          >
            {uploads.map((upload, index) => (
              <option key={upload._id} value={index}>
                {upload.filename}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Enter chart title"
            className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            {chartTypes.map((ct) => (
              ct.options ? (
                <optgroup key={ct.label} label={ct.label}>
                  {ct.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              )
            ))}
          </select>
          <select
            className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
          >
            <option value="">Select X-Axis Column</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
          >
            <option value="">Select Y-Axis Column</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md mb-5 transition duration-300"
            onClick={generateChart}
          >
            Generate Chart
          </button>
          <button
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md mb-5 transition duration-300"
            onClick={handleSaveAnalysis}
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Analysis'}
          </button>
          <button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-md mb-5 transition duration-300"
            onClick={downloadChartAsPNG}
          >
            Download as PNG
          </button>
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md transition duration-300"
            onClick={downloadChartAsPDF}
          >
            Download as PDF
          </button>
          {saveError && <p className="text-red-600 mt-3">{typeof saveError === 'string' ? saveError : saveError.message}</p>}
        </div>
      <div className={`md:w-2/3 rounded-lg shadow-lg overflow-hidden ${themeMode === 'dark' ? 'bg-gray-800' : themeMode === 'creative' ? 'bg-purple-700 bg-opacity-80' : 'bg-white'}`} style={{ height: 'auto', maxHeight: 'calc(100vh - 3rem)', minHeight: 'calc(100vh - 3rem)' }}>
        <canvas id="chartCanvas" className="w-full" style={{ height: '100%', maxHeight: '100%', minHeight: '100%' }} />
        <h3 className="mt-6 mb-4 text-2xl font-semibold text-gray-800 flex items-center justify-between">
          Saved Charts
          <button
            onClick={handleDeleteSelectedCharts}
            disabled={selectedCharts.length === 0}
            className={`ml-4 py-1 px-2 rounded text-white ${
              selectedCharts.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Delete Selected
          </button>
        </h3>
        {savedCharts.length === 0 ? (
          <>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCharts.map((chart, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 shadow hover:shadow-lg transition duration-300 ${
                  selectedCharts.includes(chart._id) ? 'ring-4 ring-red-400' : ''
                }`}
              >
                <label className="flex items-center mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCharts.includes(chart._id)}
                    onChange={() => toggleSelectChart(chart._id)}
                    className="mr-2"
                  />
                  <strong className="block text-lg font-bold mb-2">{chart.title}</strong>
                </label>
                <p className="mb-2 text-gray-700">{chart.chartType}</p>
                {chart.chartImage && (
                  <img src={chart.chartImage} alt={chart.title} className="w-full h-48 object-contain rounded" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ChartPage;