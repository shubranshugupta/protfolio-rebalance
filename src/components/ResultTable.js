import {
    Box, Paper, Typography, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Chip
} from '@mui/material';

const ResultTable = ({ funds, isMobile, results }) => {
    const currentTotalValue = funds.reduce((sum, f) => sum + (parseFloat(f.value) || 0), 0);
    const weightedXirr = currentTotalValue > 0
        ? (funds.reduce((sum, f) => sum + (f.value * f.xirr), 0) / currentTotalValue).toFixed(2)
        : 0;

    return (
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 1 }}>
                <Typography variant="h6">Allocation Plan</Typography>
                <Chip
                    label={`Portfolio Avg XIRR: ${weightedXirr}%`}
                    color={parseFloat(weightedXirr) >= 0 ? "success" : "error"}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            {/* Responsive Table Container */}
            <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Fund Name</TableCell>
                            {!isMobile && <TableCell align="right">Current %</TableCell>}
                            {!isMobile && <TableCell align="right">XIRR</TableCell>}
                            <TableCell align="right"><strong>Invest</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.data.map((row, index) => (
                            <TableRow key={row.id} hover>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                    {/* On mobile, show the details under the name since we hide columns */}
                                    {isMobile && (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            • {row.currentPct}% portfolio <br />• {row.xirr}% XIRR
                                        </Typography>
                                    )}
                                </TableCell>
                                {!isMobile && <TableCell align="right">{row.currentPct}%</TableCell>}
                                {!isMobile && <TableCell align="right">{row.xirr}%</TableCell>}
                                <TableCell align="right">
                                    <Typography color="primary.main" fontWeight="bold">
                                        ₹ {row.investAmount.toLocaleString()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: 'action.selected' }}>
                            <TableCell colSpan={isMobile ? 2 : 4} align="right"><strong>Total:</strong></TableCell>
                            <TableCell align="right">
                                <Typography variant="h6" color="success.main" fontSize={isMobile ? '1rem' : '1.25rem'}>
                                    ₹ {results.total.toLocaleString()}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default ResultTable;