export default (req: any, res: any) => {
    res.clearPreviewData();
    res.end('Preview mode disabled');
};
