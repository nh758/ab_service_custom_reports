module.exports = {
   valueFormat: (number) => {
      if (number == null) return;
      else if (!number.toLocaleString) number = parseFloat(number);

      return number.toLocaleString("en-US", { minimumFractionDigits: 2 });
   },
};
