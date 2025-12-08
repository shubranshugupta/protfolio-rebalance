import React, { useState, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, createTheme, CssBaseline, 
  Container, Paper, Typography, TextField, Button, 
  IconButton, Grid, InputAdornment, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, Stack, Chip, Avatar
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

function App() {
  // --- STATE ---
  const [mode, setMode] = useState('dark');
  const [sipAmount, setSipAmount] = useState(20000);
  const [funds, setFunds] = useState([
    { id: 1, name: "Small Cap Fund", value: 0, xirr: 15, target: 40 },
    { id: 2, name: "Flexi Cap Fund", value: 0, xirr: 12, target: 30 },
    { id: 3, name: "Mid Cap / Focused", value: 0, xirr: 18, target: 30 }
  ]);
  const [results, setResults] = useState(null);

  // --- THEME CONFIGURATION ---
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'light' ? '#2563eb' : '#a4bbecff' },
          secondary: { main: '#64748b' },
          background: {
            default: mode === 'light' ? '#f1f5f9' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 700 },
        },
        shape: { borderRadius: 12 },
      }),
    [mode],
  );

  // --- INITIAL LOAD & SAVE ---
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') || 'light';
    setMode(savedMode);

    const savedFunds = localStorage.getItem('myFunds');
    const savedSip = localStorage.getItem('sipAmount');
    if (savedFunds) setFunds(JSON.parse(savedFunds));
    if (savedSip) setSipAmount(Number.parseFloat(savedSip));
  }, []);

  const handleSave = () => {
    localStorage.setItem('myFunds', JSON.stringify(funds));
    localStorage.setItem('sipAmount', sipAmount);
    alert("Data saved successfully!");
  };

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // --- HANDLERS ---
  const updateFund = (index, field, val) => {
    const newFunds = [...funds];
    newFunds[index][field] = field === 'name' ? val : (Number.parseFloat(val) || 0);
    setFunds(newFunds);
  };

  const addFund = () => {
    setFunds([...funds, { id: Date.now(), name: "", value: "", xirr: "", target: "" }]);
  };

  const removeFund = (index) => {
    setFunds(funds.filter((_, i) => i !== index));
  };

  // --- CALCULATIONS ---
  const totalTarget = funds.reduce((sum, f) => sum + (Number.parseFloat(f.target) || 0), 0);
  
  const currentTotalValue = funds.reduce((sum, f) => sum + (Number.parseFloat(f.value) || 0), 0);
  
  const weightedXirr = currentTotalValue > 0 
    ? (funds.reduce((sum, f) => sum + (f.value * f.xirr), 0) / currentTotalValue).toFixed(2)
    : 0;

  const handleCalculate = () => {
    if (Math.abs(totalTarget - 100) > 0.1) {
      alert(`Total target must be 100%. Current: ${totalTarget}%`);
      return;
    }

    const projectedTotal = currentTotalValue + sipAmount;
    let totalDeficit = 0;

    const tempAllocations = funds.map(fund => {
      const idealValue = projectedTotal * (fund.target / 100);
      let deficit = idealValue - fund.value;
      if (deficit < 0) deficit = 0; 
      totalDeficit += deficit;
      return { ...fund, deficit };
    });

    let totalAllocated = 0;
    const finalAllocations = tempAllocations.map(fund => {
      let investAmount = 0;
      if (totalDeficit > 0) {
        investAmount = (fund.deficit / totalDeficit) * sipAmount;
      } else {
        investAmount = sipAmount * (fund.target / 100);
      }
      
      totalAllocated += investAmount;
      const currentPct = currentTotalValue > 0 
        ? ((fund.value / currentTotalValue) * 100).toFixed(1) 
        : 0;

      return { ...fund, currentPct, investAmount: Math.round(investAmount) };
    });

    setResults({ data: finalAllocations, total: Math.round(totalAllocated) });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" color="text.primary">SIP Rebalancer</Typography>
              <Typography variant="body2" color="text.secondary">Smart Inflow Allocation</Typography>
            </Box>
          </Box>
          <IconButton onClick={toggleColorMode} color="inherit" aria-label="toggle theme">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        {/* MAIN INPUT CARD */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          
          {/* SIP Amount Input */}
          <TextField
            label="Monthly SIP Amount"
            type="number"
            value={sipAmount}
            onChange={(e) => setSipAmount(Number.parseFloat(e.target.value) || 0)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }
            }}
            sx={{ mb: 4, maxWidth: 300 }}
          />

          {/* Fund Inputs List */}
          <Stack spacing={2}>
            {funds.map((fund, index) => (
              <Grid container spacing={2} alignItems="center" key={fund.id}>
                
                {/* Serial No */}
                <Grid item xs={1}>
                  <Avatar 
                    sx={{ 
                      width: 28, height: 28, fontSize: '0.9rem', 
                      bgcolor: 'action.selected', color: 'text.primary' 
                    }}
                  >
                    {index + 1}
                  </Avatar>
                </Grid>

                {/* Name */}
                <Grid item xs={12} sm={4}>
                  <TextField 
                    label="Fund Name" 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    value={fund.name}
                    onChange={(e) => updateFund(index, 'name', e.target.value)}
                  />
                </Grid>

                {/* Value */}
                <Grid item xs={6} sm={2.5}>
                  <TextField 
                    label="Value" 
                    type="number" 
                    size="small" 
                    fullWidth
                    value={fund.value}
                    onChange={(e) => updateFund(index, 'value', e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }
                    }}
                  />
                </Grid>

                {/* XIRR */}
                <Grid item xs={6} sm={2}>
                  <TextField 
                    label="XIRR" 
                    type="number" 
                    size="small" 
                    fullWidth
                    value={fund.xirr}
                    onChange={(e) => updateFund(index, 'xirr', e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }
                    }}
                  />
                </Grid>

                {/* Target */}
                <Grid item xs={6} sm={2}>
                  <TextField 
                    label="Target" 
                    type="number" 
                    size="small" 
                    fullWidth
                    value={fund.target}
                    onChange={(e) => updateFund(index, 'target', e.target.value)}
                    error={totalTarget > 100}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }
                    }}
                  />
                </Grid>

                {/* Delete */}
                <Grid item xs={6} sm={0.5}>
                  <IconButton color="error" onClick={() => removeFund(index)} aria-label="delete fund">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}
            alignItems="center"
          >
            <Button startIcon={<AddCircleIcon />} onClick={addFund}>
              Add Fund
            </Button>
            
            <Box flexGrow={1} textAlign={{ xs: 'center', sm: 'right' }}>
              <Typography variant="body2" color={totalTarget === 100 ? "success.main" : "error.main"} fontWeight="bold">
                Total Target: {totalTarget}%
              </Typography>
            </Box>

            <Button 
              variant="outlined" 
              startIcon={<SaveIcon />} 
              onClick={handleSave}
              color="warning"
            >
              Save Data
            </Button>

            <Button 
              variant="contained" 
              startIcon={<CalculateIcon />} 
              onClick={handleCalculate}
              size="large"
            >
              Calculate
            </Button>
          </Stack>
        </Paper>

        {/* RESULTS SECTION */}
        {results && (
          <Paper elevation={3} sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Allocation Plan</Typography>
              <Chip 
                label={`Portfolio Avg XIRR: ${weightedXirr}%`} 
                color="primary" 
                variant="outlined" 
                size="small"
              />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Fund Name</strong></TableCell>
                    <TableCell align="right"><strong>Current %</strong></TableCell>
                    <TableCell align="right"><strong>XIRR</strong></TableCell>
                    <TableCell align="right"><strong>Invest This Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.data.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell component="th" scope="row">{row.name}</TableCell>
                      <TableCell align="right">{row.currentPct}%</TableCell>
                      <TableCell align="right">{row.xirr}%</TableCell>
                      <TableCell align="right">
                        <Typography color="primary.main" fontWeight="bold">
                          ₹ {row.investAmount.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.selected' }}>
                    <TableCell colSpan={4} align="right"><strong>Total Investment:</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="success.main">
                        ₹ {results.total.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

      </Container>
    </ThemeProvider>
  );
}

export default App;