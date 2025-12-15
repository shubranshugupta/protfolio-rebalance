import { Box, Paper, Typography, Grid } from '@mui/material';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';

const AllocationPieChart = ({ funds }) => {
    // 1. Calculate Total Current Value to check if it's empty
    const totalCurrentValue = funds.reduce((sum, f) => sum + (parseFloat(f.value) || 0), 0);
    const isCurrentEmpty = totalCurrentValue === 0;

    // 2. Prepare Data for "Target Allocation" Chart
    const targetData = funds.map((f, index) => ({
        id: index,
        value: parseFloat(f.target) || 0,
        label: f.name,
        total: 100
    }));

    // 3. Prepare Data for "Current Allocation" Chart
    // If total value is 0, we pass 0 values so the chart appears empty but doesn't break
    const currentData = funds.map((f, index) => ({
        id: index,
        value: isCurrentEmpty ? 0 : (parseFloat(f.value) || 0),
        label: f.name,
        total: totalCurrentValue
    }));

    // --- Chart Styling Settings ---
    const chartHeight = 250;

    // Helper to format labels directly on the pie slices
    const getArcLabel = (params) => {
        if (params.total === 0) return '';
        const percent = params.value / params.total;
        // Don't show label if slice is very small (less than 3%) to avoid clutter
        if (percent < 0.03) return '';
        return `${(percent * 100).toFixed(0)}%`;
    };

    // Styling for the on-slice labels (white text, bold)
    const pieSx = {
        [`& .${pieArcLabelClasses.root}`]: {
            //   fill: theme.palette.common.white,
            fontWeight: 'bold',
            fontSize: 12,
            pointerEvents: 'none', // stops annoying tooltips on labels
        },
    };

    // Common props for both charts to hide the legend (saves space on mobile)
    const commonChartProps = {
        height: chartHeight,
        margin: { right: 10, left: 10 },
        slotProps: {
            legend: {
                hidden: false,
                // sx: {
                //     overflowY: 'scroll',
                //     flexWrap: 'nowrap',
                //     height: '100%',
                // },
                direction: 'horizontal',
                position: {
                    vertical: 'bottom',
                    horizontal: 'center'
                },
            }
        },
        sx: pieSx,
    };


    return (
        <Grid container spacing={3} mb={4} sx={{ py: 2 }}>
            {/* --- Left Chart: CURRENT STATUS --- */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Current Allocation (Actual)
                    </Typography>

                    {isCurrentEmpty ? (
                        // Fallback if user hasn't entered values yet
                        <Box height={chartHeight} display="flex" justifyContent="center" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                                Enter Fund Values to see chart
                            </Typography>
                        </Box>
                    ) : (
                        <PieChart
                            series={[
                                {
                                    data: currentData,
                                    innerRadius: 30, // Makes it a Donut chart (looks modern)
                                    outerRadius: 100,
                                    paddingAngle: 2, // Slight gap between slices
                                    cornerRadius: 4, // Rounded slice edges
                                    arcLabel: getArcLabel,
                                },
                            ]}
                            {...commonChartProps}
                        />
                    )}
                </Paper>
            </Grid>

            {/* --- Right Chart: TARGET GOAL --- */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
                        Target Allocation (Goal)
                    </Typography>
                    <PieChart
                        series={[
                            {
                                data: targetData,
                                innerRadius: 30,
                                outerRadius: 100,
                                paddingAngle: 2,
                                cornerRadius: 4,
                                arcLabel: getArcLabel,
                            },
                        ]}
                        {...commonChartProps}
                    />
                </Paper>
            </Grid>
        </Grid>
    );
};

export default AllocationPieChart;