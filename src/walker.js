var Walker = {
  Specs: [
    {
      title: "Only Two Input Elements",
      description: "SG uses this approach.",
      index: 0
    },
    {
      title: "Many Input Elements",
      description: "Vistara uses this",
      index: 1
    }
  ],
  Rules: [{ id: "Found exact two", confidence: 0.5 }],
  greet: function (message) {
    console.log(message);
  }
};

export { Walker };
