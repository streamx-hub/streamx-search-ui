class FacetNodeCounter {
  private counter: number = 0;

  public getCounter() {
    const currentCount = this.counter;
    this.counter++;

    return currentCount;
  }
}

export const facetNodeCounter = new FacetNodeCounter();
