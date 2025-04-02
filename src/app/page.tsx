"use client";
import { useState, useEffect } from "react";
import { database, ref, onValue } from "./firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";
import jsPDF from "jspdf";

interface FirebaseAccelData {
  x: number;
  y: number;
  z: number;
  temperature: number;
  timestamp: number;
}

export default function Dashboard() {
  const [sensorRef, setSensorData] = useState<FirebaseAccelData[]>([]);
  const [interval, setInterval] = useState(1);
  const [reportInterval, setDownloadInterval] = useState(10);

  const updateInterval = async (newInterval: number) => {
    const response = await fetch('http://127.0.0.1:8000/set_interval', {
      method: 'POST',
      body: JSON.stringify({ interval: newInterval }),
      headers: { 'Content-Type': 'application/json' }
    });

    return response.json(); // Ensure you return the parsed JSON result
  };

  const sendDownloadInterval = async (reportInterval: number) => {    
    const response = await fetch("https://iscf-44f40-default-rtdb.europe-west1.firebasedatabase.app/accel_data.json");
    const data = await response.json();

    const cutoffTime = Date.now() / 1000 - reportInterval * 60;

    const filteredData = Object.entries(data)
      .map(([, value]) => value as FirebaseAccelData)
      .filter((item) => item.timestamp > cutoffTime)
      .map((item) => ({
        x: item.x,
        y: item.y,
        z: item.z,
        temperature: item.temperature,
        time: new Date(item.timestamp * 1000).toLocaleString(),
        timestamp: item.timestamp
      }));

    console.log("Dados filtrados:", filteredData);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(`Relatório de Aceleração (últimos ${reportInterval} minutos)`, 20, 25);

    let y = 50;
    filteredData.forEach((item,) => {
      const line = `• [${item.time}]  X: ${item.x.toFixed(2)}, Y: ${item.y.toFixed(2)}, Z: ${item.z.toFixed(2)}, Temp: ${item.temperature.toFixed(2)}°C`;
      doc.text(line, 20, y);
      y += 15;

      // se ultrapassar o tamanho da página, adiciona nova página
      if (y > 610) {
        doc.addPage();
        y = 25;
      }
    });

    doc.save(`firebase_report_${reportInterval}_min.pdf`);
  };

  useEffect(() => {
    // In your useEffect callback:
    const unsubscribe = onValue(ref(database, "/accel_data"), (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const formattedData = Object.entries(data).map(([_, value]) => {
        // Type guard to ensure value has the correct shape
        const accelData = value as FirebaseAccelData;

        return {
          x: accelData.x,
          y: accelData.y,
          z: accelData.z,
          temperature: accelData.temperature,
          time: new Date(accelData.timestamp * 1000).toLocaleString(),
          timestamp: accelData.timestamp
        };
      });

      setSensorData(formattedData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">📊 Real-Time Accelerometer Data</h1>

      <div className="bg-gray-800 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={sensorRef} margin={{ top: 10, right: 20, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#bbb"
              angle={-45}
              textAnchor="end"
              style={{ fontSize: '12px' }} />
            <YAxis stroke="#bbb" />
            <Tooltip />
            <Line type="monotone" dataKey="x" stroke="#ff7300" name="X-Axis" />
            <Line type="monotone" dataKey="y" stroke="#387908" name="Y-Axis" />
            <Line type="monotone" dataKey="z" stroke="#8884d8" name="Z-Axis" />
            <Line type="monotone" dataKey="temperature" stroke="#FFBF00" name="Temperature" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ margin: '20px 0' }} className="flex gap-2 items-center">
        <label>Update Interval (seconds): </label>
        <input
          type="number"
          className="bg-slate-800 text-white px-4 py-2 rounded-md w-32"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          min="1"
          step="1"
        />
        <button onClick={() => updateInterval(interval)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Apply
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <label>Download Report (minutes): </label>
        <input
          type="text"
          min="1"
          className="bg-slate-800 text-white px-4 py-2 rounded-md w-32"
          value={reportInterval}
          onChange={(e) => setDownloadInterval(Number(e.target.value))}
          placeholder="Minutos"
        />
        <button onClick={() => sendDownloadInterval(reportInterval)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Download
        </button>
      </div>
    </div>
  );
}