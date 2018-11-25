"use strict";

const parseLongOptions = args => {
  if (args.h) {
    args.host = args.h;
  }

  if (args.d) {
    args.db = args.d;
  }

  if (args.u) {
    args.username = args.u;
  }

  if (args.p) {
    args.password = args.p;
  }

  if (args.a) {
    args.authsource = args.a;
  }

  if (args.c) {
    args.collection = args.c;
  }

  if (args.e) {
    args.data = args.e;
  }

  if (args.f) {
    args.format = args.f;
  }

  if (args.s) {
    args.server = args.s;
  }
};

module.exports = parseLongOptions;