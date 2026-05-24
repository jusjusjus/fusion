import numpy as np
import matplotlib.pyplot as plt

from src import (
    toy,
    circle,
    torus,
    coords,
    poincare,
    helical,
    biot_savart as bs,
)

if __name__ == "__main__":
    # torus.plot_poincare()
    # torus.plot_fieldlines()
    # torus.plot_poincare()
    # torus.plot_multiple_poincare_crossings()

    # helical.plot_poincare(B0=1.0, current=0.1)
    # toy.plot_fieldlines()
    toy.plot_poincare()

    ## Next: Lesson 9
