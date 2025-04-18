"use client";
import { useState, useEffect } from "react";
import { database, ref, onValue } from "./firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";
import jsPDF from "jspdf";
import { median, mean, mode, std, min, max } from 'mathjs';

interface FirebaseAccelData {
  x: number;
  y: number;
  z: number;
  temperature: number;
  timestamp: number;
}

export default function Dashboard() {
  //Constants related to the graph and buttons of download and interval
  const [sensorRef, setSensorData] = useState<FirebaseAccelData[]>([]);
  const [interval, setInterval] = useState(1);
  const [reportInterval, setDownloadInterval] = useState(10);
  //Constants related to the autentication 
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  //Constant related to the guest
  const [guest, setGuest] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const [alarm, setAlarm] = useState("");

  const updateInterval = async (newInterval: number) => {
    const response = await fetch('http://127.0.0.1:8000/set_interval', {
      method: 'POST',
      body: JSON.stringify({ interval: newInterval }),
      headers: { 'Content-Type': 'application/json' }
    });

    return response.json(); // Ensure you return the parsed JSON result
  };

  const validarEmail = () => {
    if (email.endsWith("@campus.fct.unl.pt") && password == "iscf2025") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Password ou email errado!");
    }
  }

  const entrarGuest = () => {
    setGuest(true);
  };

  const calcular = (valores: number[]) => {
    if (valores.length == 0) {
      return {
        media: 0,
        mediana: 0,
        moda: 0,
        desvioPadrao: 0,
        maximo: 0,
        minimo: 0
      };
    }
    return {
      media: mean(valores),
      mediana: median(valores),
      moda: mode(valores),
      desvioPadrao: std(valores),
      maximo: max(valores),
      minimo: min(valores)
    };
  };

  const sendDownloadInterval = async (reportInterval: number) => {
    const response = await fetch("https://iscf-44f40-default-rtdb.europe-west1.firebasedatabase.app/accel_data.json");
    const data = await response.json();

    const cutoffTime = Date.now() / 1000 - reportInterval * 60;

    const filteredData = Object.entries(data)
      .map(([, value]) => value as FirebaseAccelData)
      .filter((item) => item.timestamp >= cutoffTime)
      .map((item) => ({
        x: item.x,
        y: item.y,
        z: item.z,
        temperature: item.temperature,
        time: new Date(item.timestamp * 1000).toLocaleString(),
        timestamp: item.timestamp
      }));
    
    const xValues = filteredData.map(item => item.x);
    const yValues = filteredData.map(item => item.y);
    const zValues = filteredData.map(item => item.z);
    const temperatureValues = filteredData.map(item => item.temperature);

    const statsX = calcular(xValues);
    const statsY = calcular(yValues);
    const statsZ = calcular(zValues);
    const statsTemp = calcular(temperatureValues);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    let y = 20;

    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30); // Cinza escuro
    doc.setFont('helvetica', 'bold');

    // Título centralizado
    doc.text(`Relatório de Aceleração`, 210, y += 30, { align: 'center' });
    doc.setFontSize(13);
    doc.text(`Últimos ${reportInterval} minutos`, 210, y += 18, { align: 'center' });

    // Linha decorativa abaixo do título
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.5);
    doc.line(40, y += 10, 400, y);

    // Espaço antes das estatísticas
    y += 20;

    // Estatísticas - X
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Estatísticas - Eixo X", 30, y += 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`• Média: ${statsX.media.toFixed(2)}`, 35, y += 18);
    doc.text(`• Mediana: ${statsX.mediana.toFixed(2)}`, 35, y += 15);
    doc.text(`• Moda: ${statsX.moda}`, 35, y += 15);
    doc.text(`• Desvio padrão: ${statsX.desvioPadrao}`, 35, y += 15);
    doc.text(`• Máximo: ${statsX.maximo.toFixed(2)}`, 35, y += 15);
    doc.text(`• Mínimo: ${statsX.minimo.toFixed(2)}`, 35, y += 15);

    // Estatísticas - Y
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Estatísticas - Eixo Y", 30, y += 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`• Média: ${statsY.media.toFixed(2)}`, 35, y += 18);
    doc.text(`• Mediana: ${statsY.mediana.toFixed(2)}`, 35, y += 15);
    doc.text(`• Moda: ${statsY.moda}`, 35, y += 15);
    doc.text(`• Desvio padrão: ${statsY.desvioPadrao}`, 35, y += 15);
    doc.text(`• Máximo: ${statsY.maximo.toFixed(2)}`, 35, y += 15);
    doc.text(`• Mínimo: ${statsY.minimo.toFixed(2)}`, 35, y += 15);

    // Estatísticas - Z
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Estatísticas - Eixo Z", 30, y += 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`• Média: ${statsZ.media.toFixed(2)}`, 35, y += 18);
    doc.text(`• Mediana: ${statsZ.mediana.toFixed(2)}`, 35, y += 15);
    doc.text(`• Moda: ${statsZ.moda}`, 35, y += 15);
    doc.text(`• Desvio padrão: ${statsZ.desvioPadrao}`, 35, y += 15);
    doc.text(`• Máximo: ${statsZ.maximo.toFixed(2)}`, 35, y += 15);
    doc.text(`• Mínimo: ${statsZ.minimo.toFixed(2)}`, 35, y += 15);

    // Estatísticas - Temperatura
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Estatísticas - Temperatura", 30, y += 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`• Média: ${statsTemp.media.toFixed(2)}°C`, 35, y += 18);
    doc.text(`• Mediana: ${statsTemp.mediana.toFixed(2)}°C`, 35, y += 15);
    doc.text(`• Moda: ${statsTemp.moda}°C`, 35, y += 15);
    doc.text(`• Desvio padrão: ${statsTemp.desvioPadrao}°C`, 35, y += 15);
    doc.text(`• Máximo: ${statsZ.maximo.toFixed(2)}`, 35, y += 15);
    doc.text(`• Mínimo: ${statsZ.minimo.toFixed(2)}`, 35, y += 15);

    // Espaço antes dos dados individuais
    y += 25;

    // Subtítulo da secção dos dados
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text("Registos de leitura", 30, y += 10);

    // Reset de fonte para dados
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    filteredData.forEach((item, index) => {
      const line = `${index + 1}. [${item.time}]  X: ${item.x.toFixed(2)}  Y: ${item.y.toFixed(2)}  Z: ${item.z.toFixed(2)}  Temp: ${item.temperature.toFixed(2)}°C`;
      doc.text(line, 30, y += 15);

      if (y > 575) {
        doc.addPage();
        y = 40;
      }
    });
    doc.save(`firebase_report_${reportInterval}_min.pdf`);
  };

  useEffect(() => {
    // In your useEffect callback:
    const unsubscribe = onValue(ref(database, "/accel_data"), (snapshot) => {
      const data = snapshot.val();
      if (!data && !selectedDate) return;

      const formattedData = Object.entries(data).map(([, value]) => {
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

      const lastTemperature = formattedData.length > 0 ? formattedData[formattedData.length - 1].temperature : null;

      // Verifica se o último valor de temperatura ultrapassou o limite
      const tempLimit = 23;
      if (lastTemperature !== null && lastTemperature > tempLimit) {
        const alarmMessage = `AVISO! Temperatura muito alta: ${lastTemperature.toFixed(2)}°C em [${formattedData[formattedData.length - 1].time}]`;
        setAlarm(alarmMessage);  // Lança o alarme
      } else {
        setAlarm("");  // Limpa o alarme se a temperatura for inferior ao limite
      }

      let filterred = formattedData
      if (selectedDate) {
        const selectedTimestamp = new Date(selectedDate + "T00:00:00").getTime() / 1000;
        filterred = formattedData.filter(item => item.timestamp >= selectedTimestamp);
      }
      setSensorData(filterred);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {(!isAuthenticated && !guest) ? (
        <div className="max-w-md mx-auto mt-20 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Autenticação</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Escreve o teu email institucional"
            className="w-full p-3 rounded bg-slate-700 text-white mb-4"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Escreve a tua password"
            className="w-full p-3 rounded bg-slate-700 text-white mb-4"
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <button
            onClick={validarEmail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mb-2"
          >
            Entrar
          </button>

          <button
            onClick={entrarGuest}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
          >
            Entrar como guest
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">Real-Time Accelerometer Data</h1>
          <div className="flex gap-2 items-center mt-6 mb-4">
            <label>Filtrar por data:</label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]} // bloqueia datas futuras
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 text-white px-4 py-2 rounded-md"
            />
          </div>
          {alarm && <p className="text-red-500 mb-2">{alarm}</p>}
          <div className="bg-gray-800 p-4 rounded-lg text-center">Gráfico de Aceleração XYZ
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={sensorRef} margin={{ top: 10, right: 20, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#bbb" angle={-45} textAnchor="end" style={{ fontSize: '12px' }} />
                <YAxis stroke="#bbb" />
                <Tooltip />
                <Line type="monotone" dataKey="x" stroke="#ff7300" name="X-Axis" />
                <Line type="monotone" dataKey="y" stroke="#387908" name="Y-Axis" />
                <Line type="monotone" dataKey="z" stroke="#8884d8" name="Z-Axis" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg mt-8 text-center">Gráfico de Temperatura
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={sensorRef} margin={{ top: 10, right: 20, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#bbb" angle={-45} textAnchor="end" style={{ fontSize: '12px' }} />
                <YAxis stroke="#bbb" />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#FFBF00" name="Temperature" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!guest && (
            <>
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
            </>
          )}

        </>
      )}
    </div>
  );
}