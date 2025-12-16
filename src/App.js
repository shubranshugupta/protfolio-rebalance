import { useState, useEffect, useMemo } from 'react';
import {
    ThemeProvider, createTheme, CssBaseline,
    Container, Paper, Typography, TextField, Button,
    IconButton, Grid, InputAdornment,
    Box, Stack, Avatar, useMediaQuery
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import AllocationPieChart from './components/AllocationPieChart';
import ResultTable from './components/ResultTable';
import ImportPortfolio from './components/ImportPortfolio';

function App() {
    // --- STATE ---
    const [mode, setMode] = useState('light');
    const [sipAmount, setSipAmount] = useState(20000);
    const [funds, setFunds] = useState([
        { id: 1, name: "Small Cap Fund", value: 0, xirr: 15, target: 40 },
        { id: 2, name: "Flexi Cap Fund", value: 0, xirr: 12, target: 30 },
        { id: 3, name: "Mid Cap / Focused", value: 0, xirr: 18, target: 30 }
    ]);
    const [results, setResults] = useState(null);

    // --- RESPONSIVE THEME ---
    const theme = useMemo(
        () =>
            createTheme({
                breakpoints: {
                    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
                },
                palette: {
                    mode,
                    primary: { main: '#2563eb' },
                    secondary: { main: '#64748b' },
                    background: {
                        default: mode === 'light' ? '#f8fafc' : '#0f172a',
                        paper: mode === 'light' ? '#ffffff' : '#1e293b',
                    },
                },
                typography: {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    h4: {
                        fontWeight: 700,
                        // Responsive font size
                        '@media (max-width:600px)': { fontSize: '1.5rem' },
                    },
                },
                components: {
                    MuiTextField: {
                        styleOverrides: {
                            root: { backgroundColor: mode === 'light' ? '#fff' : 'transparent' }
                        }
                    }
                },
                shape: { borderRadius: 12 },
            }),
        [mode],
    );

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // --- LOAD & SAVE ---
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') || 'light';
        setMode(savedMode);
        const savedFunds = localStorage.getItem('myFunds');
        const savedSip = localStorage.getItem('sipAmount');
        if (savedFunds) setFunds(JSON.parse(savedFunds));
        if (savedSip) setSipAmount(parseFloat(savedSip));
    }, []);

    const toggleColorMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
    };

    // --- DATA MANAGEMENT (EXPORT/IMPORT) ---
    const handleSave = () => {
        localStorage.setItem('myFunds', JSON.stringify(funds));
        localStorage.setItem('sipAmount', sipAmount);

        alert("Data saved successfully!");

        const dataToExport = {
            sipAmount,
            funds,
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const href = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = href;
        link.download = `sip-rebalancer-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.funds && json.sipAmount) {
                    setFunds(json.funds);
                    setSipAmount(parseFloat(json.sipAmount));
                    // Auto-save to LocalStorage after import
                    localStorage.setItem('myFunds', JSON.stringify(json.funds));
                    localStorage.setItem('sipAmount', json.sipAmount);
                    alert("Data Imported Successfully!");
                    setResults(null);
                } else {
                    alert("Invalid file format. Missing funds or sipAmount.");
                }
            } catch (err) {
                alert("Error parsing JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        event.target.value = '';
    };

    // --- LOGIC HANDLERS ---
    const updateFund = (index, field, val) => {
        const newFunds = [...funds];
        newFunds[index][field] = field === 'name' ? val : (parseFloat(val) || 0);
        setFunds(newFunds);
    };

    const addFund = () => {
        setFunds([...funds, { id: Date.now(), name: "", value: "", xirr: "", target: "" }]);
    };

    const removeFund = (index) => {
        setFunds(funds.filter((_, i) => i !== index));
    };

    // --- CALCULATION LOGIC ---
    const totalTarget = funds.reduce((sum, f) => sum + (parseFloat(f.target) || 0), 0);
    const currentTotalValue = funds.reduce((sum, f) => sum + (parseFloat(f.value) || 0), 0);

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
            <Container maxWidth="lg" sx={{ py: 3, px: isMobile ? 2 : 3 }}>

                {/* HEADER */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <AccountBalanceWalletIcon color="primary" sx={{ fontSize: isMobile ? 32 : 40 }} />
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
                <Paper elevation={3} sx={{ p: isMobile ? 2 : 3, mb: 4 }}>

                    <Stack 
                        spacing={2} 
                        direction={{ xs: 'column', sm: 'row' }} 
                        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 2}}
                        justifyContent="space-between"
                    >
                        {/* SIP Input */}
                        <TextField
                            label="Monthly SIP Amount"
                            type="number"
                            value={sipAmount}
                            onChange={(e) => setSipAmount(parseFloat(e.target.value) || 0)}
                            fullWidth
                            slotProps={{
                                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }
                            }}
                            sx={{ maxWidth: isMobile ? '100%' : 300, mb: 3 }}
                        />

                        <ImportPortfolio funds={funds} setFunds={setFunds} isMobile={isMobile} />
                    </Stack>

                    {/* FUND ROWS (Responsive Grid) */}
                    <Stack spacing={2}>
                        {funds.map((fund, index) => (
                            <Paper
                                key={fund.id}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)',
                                    borderColor: 'divider'
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">

                                    {/* MOBILE HEADER: Serial + Name + Delete */}
                                    <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent="center">
                                            <Avatar
                                                sx={{
                                                    width: 24, height: 24, fontSize: '0.8rem',
                                                    bgcolor: 'primary.main', color: 'white'
                                                }}
                                            >
                                                {index + 1}
                                            </Avatar>
                                            {/* Show Delete Icon ONLY on Mobile here for better UX */}
                                            {isMobile && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeFund(index)}
                                                    aria-label="delete fund"
                                                    sx={{ marginLeft: "auto" }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Fund Name */}
                                    <Grid size={{ xs: 12, sm: 3 }} >
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
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <TextField
                                            label="Current Value"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={fund.value}
                                            onChange={(e) => updateFund(index, 'value', e.target.value)}
                                            slotProps={{
                                                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }
                                            }}
                                        />
                                    </Grid>

                                    {/* XIRR & Target (Split 50-50 on mobile) */}
                                    <Grid size={{ xs: 12, sm: 2 }}>
                                        <TextField
                                            label="XIRR"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={fund.xirr}
                                            onChange={(e) => updateFund(index, 'xirr', e.target.value)}
                                            slotProps={{
                                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 2 }}>
                                        <TextField
                                            label="Target"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={fund.target}
                                            onChange={(e) => updateFund(index, 'target', e.target.value)}
                                            error={totalTarget > 100}
                                            slotProps={{
                                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                                            }}
                                        />
                                    </Grid>

                                    {/* Desktop Delete Button (Hidden on Mobile) */}
                                    {!isMobile && (
                                        <Grid size={{ sm: 1 }} display="flex" justifyContent="center">
                                            <IconButton color="error" onClick={() => removeFund(index)} aria-label="delete fund">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        ))}
                    </Stack>

                    {/* ACTION BUTTONS */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}
                        alignItems="center"
                    >
                        <Button
                            variant="outlined"
                            startIcon={<AddCircleIcon />}
                            onClick={addFund}
                            fullWidth={isMobile}
                            sx={{ minWidth: 150 }}
                        >
                            Add Fund
                        </Button>

                        <Box flexGrow={1} textAlign={{ xs: 'center', sm: 'right' }} width="100%">
                            <Typography variant="body2" color={totalTarget === 100 ? "success.main" : "error.main"} fontWeight="bold">
                                Total Target: {totalTarget}%
                            </Typography>
                        </Box>

                        <Box display="flex" gap={2} width={isMobile ? "100%" : "auto"}>
                            <input
                                type="file"
                                id="import-json"
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleImport}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<FileUploadIcon />}
                                onClick={() => document.getElementById('import-json').click()}
                                color="warning"
                                fullWidth={isMobile}
                            >
                                Import
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                color="warning"
                                fullWidth={isMobile}
                            >
                                Save
                            </Button>
                        </Box>

                        <Box display="flex" gap={2} width={isMobile ? "100%" : "auto"}>
                            <Button
                                variant="contained"
                                startIcon={<CalculateIcon />}
                                onClick={handleCalculate}
                                size="large"
                                fullWidth={isMobile}
                            >
                                Calculate
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                {/* RESULTS TABLE */}
                {results && (<ResultTable funds={funds} isMobile={isMobile} results={results} />)}

                {results && (<AllocationPieChart funds={funds} />)}
            </Container>
        </ThemeProvider>
    );
}

export default App;