# frozen_string_literal: true
class Model < ApplicationRecord
  belongs_to :another

  scope :foo, -> { |f| f.bar }
  # good code for 2.4
  # scope :foo, ->(f) { f.bar }
end
