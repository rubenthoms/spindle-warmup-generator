import { useState } from 'react'
import './App.css'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, TextField } from '@mui/material'
import Plot from 'react-plotly.js';
import {Layout, PlotData} from 'plotly.js';

export type SpindleCommand = {
  id: number;
  rpm: number;
  durationMs: number;
};

function App() {
  const [title, setTitle] = useState<string>("");
  const [runningIndex, setRunningIndex] = useState<number>(0);
  const [maxRPM, setMaxRPM] = useState<number>(24000);
  const [spindleCommands, setSpindleCommands] = useState<SpindleCommand[]>([]);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  function addSpindleCommand() {
    setSpindleCommands([
      ...spindleCommands,
      {
        id: runningIndex,
        rpm: 0,
        durationMs: 0,
      }
    ]);
    setRunningIndex(prev => prev + 1);
  }

  function calcStartTimeMs(index: number) {
    let startTimeMs = 0;
    for (let i = 0; i < index; i++) {
      startTimeMs += spindleCommands[i]?.durationMs ?? 0;
    }
    return startTimeMs;
  }

  const totalTime = spindleCommands.reduce((acc, command) => acc + command.durationMs, 0);

  function formatTimeMs(timeMs: number): string {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = timeMs % 1000;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, '0')}`;
  }

  function generateGCode() {
    let gcode = `(${title})\n`;
    let currentTimeMs = 0;
    for (const command of spindleCommands) {
      if (command.rpm === 0) {
        gcode += `M05\n`;
        currentTimeMs += command.durationMs;
        gcode += `G04 P${command.durationMs}\n`;
        continue;
      }
      gcode += `S${command.rpm} M03\n`;
      currentTimeMs += command.durationMs;
      gcode += `G04 P${command.durationMs}\n`;
    }
    gcode += "M05\n";
    gcode += "M30\n";
    return gcode;
  }

  const plotLayout: Partial<Layout> = {
    xaxis: {
      title: "Time",
      tickformat: "%H:%M:%S.%2f",
      domain: [0, totalTime]
    },
    yaxis: {
      title: "RPM",
    },
    height: 680
  };

  const x: Date[] = [];
  const y: number[] = [];
  let currentTimeMs =  - 60 * 60 * 1000;
  for (const command of spindleCommands) {
    x.push(new Date(currentTimeMs));
    y.push(command.rpm);
    currentTimeMs += command.durationMs;
    x.push(new Date(currentTimeMs));
    y.push(command.rpm);
  }

  const plotData: Partial<PlotData>[] = [{
    x,
    y,
    type: 'scatter',
    mode: 'lines',
  }];

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 1280,
        height: 800,
        backgroundColor: "white",
        display: "flex"
      }}>
        <div style={{ width: 480, height: 680, borderRight: "1px #ccc solid", padding: 20, textAlign: "left" }}>
        <h4>Program title</h4>
          <TextField label="Title" type="text" value={title} onChange={(e) =>setTitle(e.target.value)} sx={{ m: 1, width: 400 }} placeholder="Spindle Warm-up" />
        <h4>Spindle parameters</h4>
          <TextField label="Max. RPM" type="number" value={maxRPM} onChange={(e) => setMaxRPM(parseInt(e.target.value))} sx={{ m: 1, width: 400 }} InputProps={{
                startAdornment: <InputAdornment position="start">rpm</InputAdornment>,
          }} />
          <h4>Spindle speed commands</h4>
          <div style={{ border: "1px #ccc solid", height: 380, overflow:'auto' }}>
            {
              spindleCommands.map((command, index) => (
                <div style={{ margin: 8 }}>
                  {index+ 1}. Start time: {formatTimeMs(calcStartTimeMs(index))}
                <div key={command.id} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <TextField label="RPM" type="number" value={command.rpm} onChange={(e) => {
                    setSpindleCommands(spindleCommands.map((c) => {
                      if (c.id === command.id) {
                        return {
                          ...c,
                          rpm: parseInt(e.target.value)
                        }
                      }
                      return c;
                    }))
                  }} sx={{ m: 1, width: 150 }} InputProps={{
                    startAdornment: <InputAdornment position="start">rpm</InputAdornment>,
                  }} />
                  <TextField label="Duration" type="number" value={command.durationMs / 1000} onChange={(e) => {
                    setSpindleCommands(spindleCommands.map((c) => {
                      if (c.id === command.id) {
                        return {
                          ...c,
                          durationMs: parseInt(e.target.value) * 1000
                        }
                      }
                      return c;
                    }))
                  }} sx={{ m: 1, width: 150 }} InputProps={{
                    startAdornment: <InputAdornment position="start">secs</InputAdornment>,
                  }} />
                  <Button variant="text" color="error" onClick={() => {
                    setSpindleCommands(spindleCommands.filter((c) => c.id !== command.id));
                  }}>Remove</Button>
                </div></div>))
            }
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 16}}><Button variant="contained" onClick={addSpindleCommand}>Add</Button></div>
        </div>
        <div style={{ width: 760, height: 680, marginLeft: 16 }}>
          <Plot layout={plotLayout} data={plotData} />
          <Button variant="contained" style={{ marginTop: 16 }} onClick={() => setShowDialog(true)}>Generate G-code</Button>
        </div>
      </div>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Generated G-Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <textarea style={{ width: 400, height: 400 }} value={generateGCode()} readOnly />
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
