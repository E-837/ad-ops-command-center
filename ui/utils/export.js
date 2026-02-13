(function () {
  function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  function exportToCSV(data, filename = 'export.csv') {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Array.from(new Set(data.flatMap(row => Object.keys(row || {}))));
    const lines = [headers.join(',')];

    data.forEach((row) => {
      lines.push(headers.map(h => escapeCSV(row?.[h])).join(','));
    });

    return lines.join('\n');
  }

  function exportToPDF(html, filename = 'export.pdf') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return false;

    printWindow.document.write(`<!doctype html><html><head><title>${filename}</title></head><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return true;
  }

  function exportToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  window.ExportUtils = {
    exportToCSV,
    exportToPDF,
    exportToJSON,
    downloadFile,
    copyToClipboard
  };
})();
